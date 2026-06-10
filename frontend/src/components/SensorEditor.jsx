import { useState, useRef, useCallback } from 'react'
import { MM, RULER, SW_MM, SH_MM } from '../constants/sensorGrid'

// ─── Grade milimétrica ────────────────────────────────────────────────────────
function GridLines({ boardW, boardH }) {
  const canvasW = RULER + boardW * MM
  const canvasH = RULER + boardH * MM
  const v = []
  for (let mm = 0; mm <= boardW; mm++) {
    const x     = RULER + mm * MM
    const major = mm % 10 === 0
    const mid   = !major && mm % 5 === 0
    v.push(
      <line key={`v${mm}`}
        x1={x} y1={RULER} x2={x} y2={canvasH}
        stroke={major ? '#1e3d5c' : mid ? '#122030' : '#0b1520'}
        strokeWidth={major ? 0.8 : mid ? 0.5 : 0.3}
      />
    )
  }
  for (let mm = 0; mm <= boardH; mm++) {
    const y     = RULER + mm * MM
    const major = mm % 10 === 0
    const mid   = !major && mm % 5 === 0
    v.push(
      <line key={`h${mm}`}
        x1={RULER} y1={y} x2={canvasW} y2={y}
        stroke={major ? '#1e3d5c' : mid ? '#122030' : '#0b1520'}
        strokeWidth={major ? 0.8 : mid ? 0.5 : 0.3}
      />
    )
  }
  return <g>{v}</g>
}

// ─── Régua ────────────────────────────────────────────────────────────────────
function Ruler({ boardW, boardH }) {
  const canvasW = RULER + boardW * MM
  const canvasH = RULER + boardH * MM
  const xMarks = []
  for (let mm = 0; mm <= boardW; mm++) {
    const x     = RULER + mm * MM
    const major = mm % 10 === 0
    const mid   = !major && mm % 5 === 0
    const tickH = major ? 10 : mid ? 6 : 3
    xMarks.push(
      <g key={`rx${mm}`}>
        <line x1={x} y1={RULER - tickH} x2={x} y2={RULER}
              stroke={major ? '#475569' : '#1e293b'}
              strokeWidth={major ? 0.8 : 0.4}/>
        {major && mm > 0 && (
          <text x={x + 2} y={RULER - 3} fontSize="7" fill="#475569">{mm}</text>
        )}
      </g>
    )
  }

  const yMarks = []
  for (let mm = 0; mm <= boardH; mm++) {
    const y     = RULER + mm * MM
    const major = mm % 10 === 0
    const mid   = !major && mm % 5 === 0
    const tickW = major ? 10 : mid ? 6 : 3
    yMarks.push(
      <g key={`ry${mm}`}>
        <line x1={RULER - tickW} y1={y} x2={RULER} y2={y}
              stroke={major ? '#475569' : '#1e293b'}
              strokeWidth={major ? 0.8 : 0.4}/>
        {major && mm > 0 && (
          <text
            x={RULER - 3} y={y - 2}
            fontSize="7" fill="#475569"
            textAnchor="end"
            transform={`rotate(-90 ${RULER - 3} ${y - 2})`}
          >{mm}</text>
        )}
      </g>
    )
  }

  return (
    <g>
      <rect x={0} y={0} width={canvasW} height={RULER} fill="#07101a"/>
      <rect x={0} y={0} width={RULER}    height={canvasH} fill="#07101a"/>
      <rect x={0} y={0} width={RULER}    height={RULER}   fill="#07101a"/>
      <text x={RULER / 2} y={RULER / 2 + 3} textAnchor="middle" fontSize="6" fill="#334155">mm</text>
      {xMarks}
      {yMarks}
    </g>
  )
}

// ─── Linha de array ───────────────────────────────────────────────────────────
function SensorArrayLine({ sensors }) {
  if (sensors.length < 2) return null
  const sorted = [...sensors].sort((a, b) => a.x - b.x)
  const y = RULER + sorted[0].y * MM
  return (
    <line
      x1={RULER + sorted[0].x * MM}
      y1={y}
      x2={RULER + sorted[sorted.length - 1].x * MM}
      y2={y}
      stroke="#1d4ed8" strokeWidth="1" strokeDasharray="4 3" opacity="0.6"
    />
  )
}

// ─── Nó visual de um sensor IR ────────────────────────────────────────────────
function SensorNode({ sensor, selected, order, onPointerDown, onContextMenu }) {
  const cx = RULER + sensor.x * MM
  const cy = RULER + sensor.y * MM
  const sw = SW_MM * MM
  const sh = SH_MM * MM

  return (
    <g
      transform={`translate(${cx - sw / 2},${cy - sh / 2})`}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      style={{ cursor: 'grab', userSelect: 'none' }}
    >
      {selected && (
        <rect x={-3} y={-3} width={sw + 6} height={sh + 6}
              rx={4} fill="none"
              stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 2"
              opacity="0.9"/>
      )}

      <rect width={sw} height={sh} rx={2}
            fill={selected ? '#0f2744' : '#0a1a2a'}
            stroke={selected ? '#3b82f6' : '#1e4060'}
            strokeWidth="1"/>

      <rect width={sw} height={4} rx={2}
            fill={selected ? '#1d4ed8' : '#1e3a5f'} opacity="0.8"/>

      <circle cx={sw - 5} cy={5} r={4.5}
              fill="#0f172a" stroke="#1e3a5f" strokeWidth="0.5"/>
      <text x={sw - 5} y={8}
            textAnchor="middle" fontSize="5.5"
            fill={selected ? '#60a5fa' : '#475569'}
            fontFamily="monospace">
        {order + 1}
      </text>

      <text x={sw / 2} y={sh / 2 - 1}
            textAnchor="middle" fontSize="9"
            fill={selected ? '#93c5fd' : '#cbd5e1'}
            fontWeight="bold" fontFamily="monospace">
        {sensor.label}
      </text>

      <text x={sw / 2} y={sh / 2 + 9}
            textAnchor="middle" fontSize="6"
            fill="#475569" fontFamily="monospace">
        G{sensor.pin}
      </text>

      <circle cx={sw / 2 - 5} cy={sh - 5} r={3}
              fill="#1a0505" stroke="#dc2626" strokeWidth="0.8"/>
      <circle cx={sw / 2 + 5} cy={sh - 5} r={3}
              fill="#051a0f" stroke="#16a34a" strokeWidth="0.8"/>
    </g>
  )
}

// ─── Campo de edição ──────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1
                   text-sm text-white font-mono focus:outline-none focus:border-blue-500"
      />
    </div>
  )
}

// ─── Input numérico inline para dimensões ─────────────────────────────────────
function DimInput({ value, min, max, onChange }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={e => onChange(Number(e.target.value))}
      className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1
                 text-xs text-white font-mono text-center
                 focus:outline-none focus:border-yellow-500"
    />
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SensorEditor({ layout, onApply }) {
  const {
    sensors, boardW, boardH,
    addSensor, removeSensor, moveSensor, updateSensor,
    clearAll, resizeBoard, getOrdered, exportConfig,
  } = layout

  const [applied,    setApplied]    = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [snap,       setSnap]       = useState(5)
  const [showExport, setShowExport] = useState(false)
  const [cursor,     setCursor]     = useState({ x: '0.0', y: '0.0' })

  // Dimensões derivadas (reativas)
  const canvasW = RULER + boardW * MM
  const canvasH = RULER + boardH * MM

  const svgRef  = useRef(null)
  const dragRef = useRef(null)

  function handleApply() {
    onApply()
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  // ─── Drag ────────────────────────────────────────────────────────────────
  function svgPoint(e) {
    const r = svgRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function handleSensorPointerDown(e, id) {
    e.preventDefault()
    e.stopPropagation()
    setSelected(id)
    const s     = sensors.find(s => s.id === id)
    const { x, y } = svgPoint(e)
    dragRef.current = {
      id,
      offsetXpx: x - (RULER + s.x * MM),
      offsetYpx: y - (RULER + s.y * MM),
    }
    svgRef.current.setPointerCapture(e.pointerId)
  }

  const handleSvgPointerMove = useCallback((e) => {
    const { x, y } = svgPoint(e)
    const mmX = Math.max(0, Math.min(boardW, (x - RULER) / MM))
    const mmY = Math.max(0, Math.min(boardH, (y - RULER) / MM))
    setCursor({ x: mmX.toFixed(1), y: mmY.toFixed(1) })

    if (!dragRef.current) return
    const d  = dragRef.current
    let nx   = (x - RULER - d.offsetXpx) / MM
    let ny   = (y - RULER - d.offsetYpx) / MM
    nx = Math.round(nx / snap) * snap
    ny = Math.round(ny / snap) * snap
    nx = Math.max(0, Math.min(boardW, nx))
    ny = Math.max(0, Math.min(boardH, ny))
    moveSensor(d.id, nx, ny)
  }, [snap, boardW, boardH, moveSensor])

  function handleSvgPointerUp() {
    dragRef.current = null
  }

  function handleContextMenu(e, id) {
    e.preventDefault()
    removeSensor(id)
    if (selected === id) setSelected(null)
  }

  const ordered        = getOrdered()
  const selectedSensor = sensors.find(s => s.id === selected)

  return (
    <div className="flex flex-col gap-4">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={addSensor}
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded-lg
                     text-sm font-medium transition-colors"
        >
          + Sensor
        </button>

        {/* Snap */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Snap:</span>
          {[1, 2, 5, 10].map(s => (
            <button key={s} onClick={() => setSnap(s)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                snap === s
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {s}mm
            </button>
          ))}
        </div>

        {/* Dimensões da área */}
        <div className="flex items-center gap-1.5 border-l border-gray-800 pl-3">
          <span className="text-xs text-gray-500">Área:</span>
          <DimInput
            value={boardW} min={50} max={800}
            onChange={w => resizeBoard(w, boardH)}
          />
          <span className="text-xs text-gray-600">×</span>
          <DimInput
            value={boardH} min={30} max={400}
            onChange={h => resizeBoard(boardW, h)}
          />
          <span className="text-xs text-gray-500">mm</span>
        </div>

        <span className="text-xs text-gray-700 hidden sm:block">
          Arraste • Botão direito remove
        </span>

        <div className="ml-auto flex gap-2">
          <button
            onClick={handleApply}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              applied
                ? 'bg-green-600 text-white scale-95'
                : 'bg-yellow-600 hover:bg-yellow-500 text-white'
            }`}
          >
            {applied ? '✓ Dashboard atualizado' : 'Atualizar Dashboard'}
          </button>
          <button
            onClick={() => setShowExport(v => !v)}
            className="px-3 py-1.5 bg-green-800 hover:bg-green-700 rounded-lg
                       text-sm font-medium transition-colors"
          >
            {showExport ? 'Fechar export' : 'Exportar C++'}
          </button>
          <button
            onClick={() => { clearAll(); setSelected(null) }}
            className="px-3 py-1.5 bg-gray-800 hover:bg-red-900 rounded-lg
                       text-sm font-medium text-gray-400 transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* ── Canvas + Painel lateral ── */}
      <div className="flex gap-4 items-start">

        <div className="overflow-auto rounded-xl border border-gray-800 flex-1">
          <svg
            ref={svgRef}
            width={canvasW}
            height={canvasH}
            style={{ display: 'block', background: '#080f1a' }}
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
          >
            <rect x={RULER} y={RULER}
                  width={boardW * MM} height={boardH * MM}
                  fill="#080f1a"/>

            <GridLines boardW={boardW} boardH={boardH}/>

            <circle cx={RULER} cy={RULER} r={2.5} fill="#1d4ed8" opacity="0.5"/>

            <SensorArrayLine sensors={sensors}/>

            {sensors.map(s => {
              const order = ordered.findIndex(o => o.id === s.id)
              return (
                <SensorNode
                  key={s.id}
                  sensor={s}
                  selected={s.id === selected}
                  order={order}
                  onPointerDown={e => handleSensorPointerDown(e, s.id)}
                  onContextMenu={e => handleContextMenu(e, s.id)}
                />
              )
            })}

            <Ruler boardW={boardW} boardH={boardH}/>

            <text x={canvasW - 4} y={RULER - 4}
                  textAnchor="end" fontSize="7.5"
                  fill="#334155" fontFamily="monospace">
              {cursor.x}, {cursor.y} mm
            </text>
          </svg>
        </div>

        {/* Painel lateral */}
        <div className="w-52 shrink-0 flex flex-col gap-3">

          {selectedSensor ? (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Propriedades
              </h3>
              <div className="flex flex-col gap-3">
                <Field label="Label" value={selectedSensor.label}
                  onChange={v => updateSensor(selected, { label: v })}/>
                <Field label="GPIO (pino)" type="number" value={selectedSensor.pin}
                  onChange={v => updateSensor(selected, { pin: Number(v) })}/>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nível ativo</label>
                  <select
                    value={selectedSensor.activeHigh ? 'high' : 'low'}
                    onChange={e => updateSensor(selected, { activeHigh: e.target.value === 'high' })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1
                               text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="high">HIGH — linha preta</option>
                    <option value="low">LOW  — linha branca</option>
                  </select>
                </div>
                <div className="text-xs text-gray-600 font-mono bg-gray-800 rounded px-2 py-1.5">
                  x: {selectedSensor.x} mm &nbsp; y: {selectedSensor.y} mm
                </div>
                <button
                  onClick={() => { removeSensor(selected); setSelected(null) }}
                  className="w-full py-1.5 bg-red-900/40 hover:bg-red-800 text-red-400
                             rounded text-xs transition-colors"
                >
                  Remover sensor
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
              <p className="text-xs text-gray-600 leading-relaxed">
                Clique num sensor para editar suas propriedades
              </p>
              <p className="text-xs text-gray-700 mt-2">Botão direito para remover</p>
            </div>
          )}

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Array (esq → dir)
            </h3>
            <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
              {ordered.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
                              text-xs transition-colors ${
                    s.id === selected
                      ? 'bg-blue-900/50 text-blue-300'
                      : 'hover:bg-gray-800 text-gray-400'
                  }`}
                >
                  <span className="text-gray-600 w-4 shrink-0">{i + 1}.</span>
                  <span className="font-mono font-bold flex-1">{s.label}</span>
                  <span className="text-gray-600 font-mono">G{s.pin}</span>
                </div>
              ))}
              {ordered.length === 0 && (
                <p className="text-xs text-gray-700 text-center py-2">Nenhum sensor</p>
              )}
            </div>
          </div>

          {/* Info de dimensões */}
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-600 text-center font-mono">
              {boardW} × {boardH} mm
            </p>
            <p className="text-xs text-gray-700 text-center mt-0.5">
              {(boardW * boardH / 100).toFixed(0)} cm²
            </p>
          </div>
        </div>
      </div>

      {/* ── Export C++ ── */}
      {showExport && (
        <div className="bg-gray-900 rounded-xl p-4 border border-green-900/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider">
              config.h — gerado automaticamente
            </h3>
            <button
              onClick={() => navigator.clipboard?.writeText(exportConfig())}
              className="text-xs px-2.5 py-1 bg-green-900/40 hover:bg-green-800
                         text-green-400 rounded transition-colors"
            >
              Copiar
            </button>
          </div>
          <pre className="text-xs font-mono text-green-300 bg-gray-950 rounded p-3
                          overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {exportConfig()}
          </pre>
          <p className="text-xs text-gray-600 mt-2">
            Cole em <span className="font-mono text-gray-500">backend/cpp/src/config.h</span>
          </p>
        </div>
      )}
    </div>
  )
}
