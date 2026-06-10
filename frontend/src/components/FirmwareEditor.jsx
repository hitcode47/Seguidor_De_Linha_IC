import { useCallback, useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000')

// ── Helpers ───────────────────────────────────────────────────────────────────

// Parse GCC/Clang: "file.cpp:42:10: error: msg"
function parseMarkers(output, monaco) {
  const re   = /([^:\n\r]+):(\d+):(\d+):\s*(error|warning|note):\s*(.+)/g
  const out  = []
  let m
  while ((m = re.exec(output)) !== null) {
    out.push({
      file:     m[1],
      line:     parseInt(m[2]),
      col:      parseInt(m[3]),
      severity: m[4] === 'error' ? monaco.MarkerSeverity.Error
              : m[4] === 'warning' ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Info,
      message:  m[5].trim(),
    })
  }
  return out
}

function colorize(line) {
  if (/error:/i.test(line))   return 'text-red-400'
  if (/warning:/i.test(line)) return 'text-yellow-400'
  if (/\[EXIT 0\]/.test(line) || /SUCCESS/.test(line)) return 'text-green-400'
  if (/\[EXIT/.test(line))    return 'text-red-400'
  if (/^─+/.test(line))       return 'text-gray-600'
  return 'text-gray-400'
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function FirmwareEditor() {
  const [files,      setFiles]      = useState([])
  const [active,     setActive]     = useState(null)
  const [contents,   setContents]   = useState({})  // cache filename → content
  const [dirty,      setDirty]      = useState({})   // filename → bool
  const [lines,      setLines]      = useState([])   // console lines
  const [status,     setStatus]     = useState('idle') // idle | saving | building | uploading
  const [serverOk,   setServerOk]   = useState(null)

  const editorRef  = useRef(null)
  const monacoRef  = useRef(null)
  const consoleRef = useRef(null)

  // Auto-scroll console
  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight, behavior: 'smooth' })
  }, [lines])

  function appendLines(text) {
    const newLines = text.split('\n').filter(l => l.trim() !== '')
    setLines(prev => [...prev, ...newLines])
  }

  // Verifica servidor e carrega lista de arquivos
  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(() => {
        setServerOk(true)
        return fetch(`${API}/api/files`).then(r => r.json())
      })
      .then(list => {
        setFiles(list)
        if (list.length) loadFile(list[0].name)
      })
      .catch(() => {
        setServerOk(false)
        appendLines('⚠  Servidor offline — inicie o backend Python para carregar arquivos.\n    cd backend/python && python server.py')
      })
  }, [])

  function loadFile(name) {
    if (contents[name] !== undefined) { setActive(name); return }
    fetch(`${API}/api/files/${name}`)
      .then(r => r.json())
      .then(({ content }) => {
        setContents(prev => ({ ...prev, [name]: content }))
        setActive(name)
      })
      .catch(() => appendLines(`⚠  Falha ao carregar ${name}`))
  }

  function handleChange(value) {
    setContents(prev => ({ ...prev, [active]: value }))
    setDirty(prev => ({ ...prev, [active]: true }))
  }

  function handleEditorMount(editor, monaco) {
    editorRef.current  = editor
    monacoRef.current  = monaco

    // Ctrl+S → Salvar
    editor.addAction({
      id: 'save', label: 'Salvar',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => save(),
    })
    // F9 → Compilar
    editor.addAction({
      id: 'build', label: 'Compilar',
      keybindings: [monaco.KeyCode.F9],
      run: () => runAction('build', 'pio run'),
    })
  }

  // Salva um arquivo
  async function saveFile(name) {
    const content = contents[name]
    if (content === undefined) return
    await fetch(`${API}/api/files/${name}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content }),
    })
    setDirty(prev => ({ ...prev, [name]: false }))
  }

  async function save() {
    if (!active || !dirty[active] || status !== 'idle') return
    setStatus('saving')
    try {
      await saveFile(active)
      appendLines(`✓  ${active} salvo`)
    } catch {
      appendLines(`✗  Falha ao salvar ${active}`)
    }
    setStatus('idle')
  }

  // Salva todos os sujos, depois chama endpoint de build/upload com streaming
  async function runAction(endpoint, label) {
    if (status !== 'idle') return
    setStatus(endpoint === 'build' ? 'building' : 'uploading')
    setLines(prev => [...prev, ``, `─── ${label} ${'─'.repeat(40 - label.length)}`, ``])

    // Salva todos os arquivos com alterações
    try {
      for (const name of Object.keys(dirty)) {
        if (dirty[name]) await saveFile(name)
      }
    } catch {
      appendLines('⚠  Falha ao salvar arquivos antes de compilar')
      setStatus('idle')
      return
    }

    try {
      const resp = await fetch(`${API}/api/${endpoint}`, { method: 'POST' })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const reader  = resp.body.getReader()
      const decoder = new TextDecoder()
      let fullOut   = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullOut += chunk
        appendLines(chunk)
      }

      // Marca erros no editor
      if (monacoRef.current && editorRef.current && active) {
        const model   = editorRef.current.getModel()
        const markers = parseMarkers(fullOut, monacoRef.current)
          .filter(e => fullOut.includes(active.replace(/\.[^.]+$/, '')))
          .map(e => ({
            startLineNumber: e.line, endLineNumber: e.line,
            startColumn: e.col,      endColumn:     e.col + 1,
            message:  e.message,
            severity: e.severity,
          }))
        if (model) monacoRef.current.editor.setModelMarkers(model, 'pio', markers)
      }
    } catch {
      appendLines('⚠  Servidor offline ou PlatformIO não encontrado')
    }

    setStatus('idle')
  }

  function clearConsole() { setLines([]) }

  // ── Render ──────────────────────────────────────────────────────────────────
  const isBusy = status !== 'idle'
  const statusLabel = { saving: 'Salvando…', building: 'Compilando…', uploading: 'Enviando para ESP32…' }[status]

  return (
    <div className="flex flex-col gap-0" style={{ height: 'calc(100vh - 130px)' }}>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-t-xl">

        {/* Tabs de arquivo */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none min-w-0">
          {files.length === 0 && (
            <span className="text-xs text-gray-700 font-mono px-2">
              {serverOk === false ? '⚠ sem servidor' : 'carregando…'}
            </span>
          )}
          {files.map(f => (
            <button
              key={f.name}
              onClick={() => loadFile(f.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-colors ${
                active === f.name
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              {dirty[f.name] && (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"/>
              )}
              {f.name}
            </button>
          ))}
        </div>

        {/* Status */}
        {statusLabel && (
          <span className="text-xs text-gray-500 font-mono animate-pulse shrink-0">
            {statusLabel}
          </span>
        )}

        {/* Ações */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={save}
            title="Ctrl+S"
            disabled={!dirty[active] || isBusy}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded text-xs font-medium text-gray-300 transition-colors">
            Salvar
          </button>
          <button onClick={() => runAction('build', 'pio run')}
            title="F9"
            disabled={isBusy}
            className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 disabled:opacity-40 rounded text-xs font-semibold text-white transition-colors">
            Compilar
          </button>
          <button onClick={() => runAction('upload', 'pio run --target upload')}
            disabled={isBusy}
            className="px-3 py-1.5 bg-green-800 hover:bg-green-700 disabled:opacity-40 rounded text-xs font-semibold text-white transition-colors">
            Upload ESP32
          </button>
          <button onClick={clearConsole}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-500 transition-colors">
            Limpar
          </button>
        </div>
      </div>

      {/* ── Editor + Console ──────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 border-x border-b border-gray-800 rounded-b-xl overflow-hidden">

        {/* Monaco */}
        <div className="flex-1 min-w-0 bg-[#1e1e1e]">
          {active && contents[active] !== undefined ? (
            <Editor
              height="100%"
              language="cpp"
              theme="vs-dark"
              value={contents[active]}
              onChange={handleChange}
              onMount={handleEditorMount}
              options={{
                fontSize:           13,
                fontFamily:         '"JetBrains Mono","Fira Code",Consolas,monospace',
                fontLigatures:      true,
                minimap:            { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers:        'on',
                glyphMargin:        true,
                folding:            true,
                renderLineHighlight:'gutter',
                cursorBlinking:     'smooth',
                smoothScrolling:    true,
                bracketPairColorization: { enabled: true },
                padding:            { top: 12 },
                tabSize:            4,
                insertSpaces:       true,
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
              <p className="text-xs text-gray-700 font-mono">
                {files.length === 0 ? 'Aguardando servidor…' : 'Selecione um arquivo'}
              </p>
            </div>
          )}
        </div>

        {/* Console */}
        <div className="w-80 shrink-0 flex flex-col border-l border-gray-800 bg-gray-950">
          <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
              Console
            </span>
            <div className="flex items-center gap-2">
              {serverOk !== null && (
                <span className={`text-[10px] font-mono ${serverOk ? 'text-green-700' : 'text-red-800'}`}>
                  {serverOk ? 'servidor ok' : 'offline'}
                </span>
              )}
              {isBusy && (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"/>
              )}
            </div>
          </div>
          <div
            ref={consoleRef}
            className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-px"
          >
            {lines.length === 0
              ? <span className="text-gray-800">Saída de compilação e upload aparece aqui…</span>
              : lines.map((l, i) => (
                  <div key={i} className={colorize(l)}>{l || ' '}</div>
                ))
            }
          </div>
        </div>
      </div>

    </div>
  )
}
