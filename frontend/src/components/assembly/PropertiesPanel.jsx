import { useState } from 'react'
import { COMPONENT_DEFS, CATEGORIES, PIN_TYPES, PROTOCOLS } from '../../data/componentLibrary'

export default function PropertiesPanel({ selectedNode, selectedEdge, nodes, edges, onUpdateEdge }) {
  const [tab, setTab] = useState('info')

  return (
    <>
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 shrink-0">
        {['info', 'table'].map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-colors border-b-2 ${
              tab === t
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-400'
            }`}>
            {t === 'info' ? 'Propriedades' : `Tabela (${edges.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'info'  && <InfoTab  selectedNode={selectedNode} selectedEdge={selectedEdge} nodes={nodes} onUpdateEdge={onUpdateEdge}/>}
        {tab === 'table' && <TableTab nodes={nodes} edges={edges}/>}
      </div>
    </>
  )
}

// ── Info tab ─────────────────────────────────────────────────────────────────

function InfoTab({ selectedNode, selectedEdge, nodes, onUpdateEdge }) {
  if (selectedEdge) return <EdgeProperties edge={selectedEdge} nodes={nodes} onUpdate={onUpdateEdge}/>
  if (selectedNode) return <NodeProperties node={selectedNode}/>
  return (
    <div className="flex flex-col items-center justify-center h-36 gap-2">
      <div className="text-2xl opacity-20">⬡</div>
      <p className="text-[10px] text-gray-700">Selecione um componente<br/>ou conexão</p>
    </div>
  )
}

function NodeProperties({ node }) {
  const comp = COMPONENT_DEFS.find(c => c.id === node.data?.compId)
  if (!comp) return null
  const cat = CATEGORIES[comp.category]
  const allPins = [
    ...comp.leftPins.map(p => ({ ...p, side: 'E' })),
    ...comp.rightPins.map(p => ({ ...p, side: 'D' })),
  ]

  return (
    <div className="p-3 space-y-3">
      {/* Component card */}
      <div className="rounded-lg border border-gray-800 overflow-hidden"
           style={{ background: comp.color + 'cc' }}>
        <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-white truncate">{comp.name}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded font-semibold shrink-0"
                style={{ background: cat?.bg, color: cat?.color }}>
            {cat?.label}
          </span>
        </div>
        <p className="px-3 py-2 text-[9px] text-gray-400 leading-relaxed">{comp.description}</p>
      </div>

      {/* Pin list */}
      <div>
        <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">
          Pinos ({allPins.length})
        </div>
        <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
          {allPins.map(pin => {
            const pt = PIN_TYPES[pin.type] ?? PIN_TYPES.gpio
            return (
              <div key={pin.id}
                   className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-900 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pt.color }}/>
                <span className="flex-1 text-[9px] text-gray-300 font-mono truncate">{pin.label}</span>
                <span className="text-[8px] px-1 rounded shrink-0"
                      style={{ background: pt.color + '20', color: pt.color }}>
                  {pt.label}
                </span>
                <span className="text-[8px] text-gray-700 w-3 text-right shrink-0">{pin.side}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EdgeProperties({ edge, nodes, onUpdate }) {
  const fromNode = nodes.find(n => n.id === edge.source)
  const toNode   = nodes.find(n => n.id === edge.target)
  const fromComp = COMPONENT_DEFS.find(c => c.id === fromNode?.data?.compId)
  const toComp   = COMPONENT_DEFS.find(c => c.id === toNode?.data?.compId)

  const allFromPins = [...(fromComp?.leftPins ?? []), ...(fromComp?.rightPins ?? [])]
  const allToPins   = [...(toComp?.leftPins   ?? []), ...(toComp?.rightPins   ?? [])]
  const fromPin = allFromPins.find(p => p.id === edge.sourceHandle)
  const toPin   = allToPins.find(p   => p.id === edge.targetHandle)

  const protoColor = {
    power_5v:'#ef4444', power_3v3:'#f97316', ground:'#9ca3af',
    gpio:'#60a5fa', adc:'#34d399', pwm:'#c084fc', i2c:'#22d3ee',
    spi:'#fbbf24', uart:'#f472b6', motor_out:'#a3e635', enable:'#fde047',
  }
  const color = protoColor[edge.data?.protocol] ?? '#6b7280'

  return (
    <div className="p-3 space-y-3">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Conexão</div>

      {/* From → To */}
      <div className="rounded-lg bg-gray-900 border border-gray-800 p-2.5 space-y-2">
        {[
          { label: 'De',   comp: fromComp, pin: fromPin },
          { label: 'Para', comp: toComp,   pin: toPin   },
        ].map(({ label, comp, pin }) => (
          <div key={label} className="flex items-start gap-2">
            <span className="text-[9px] text-gray-600 w-7 pt-0.5 shrink-0">{label}</span>
            <div>
              <div className="text-[10px] text-white font-medium">{comp?.name ?? '?'}</div>
              {pin && (
                <div className="text-[9px] text-gray-500 font-mono mt-0.5">{pin.label}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Signal name */}
      <div>
        <label className="text-[9px] text-gray-600 uppercase tracking-widest block mb-1">
          Nome do Sinal
        </label>
        <input
          value={edge.data?.signal ?? ''}
          onChange={e => onUpdate(edge.id, { signal: e.target.value })}
          placeholder="ex: SENSOR_1, MOTOR_PWM_A"
          className="w-full px-2 py-1.5 rounded bg-gray-800 text-xs text-white
                     placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 font-mono"
        />
      </div>

      {/* Protocol */}
      <div>
        <label className="text-[9px] text-gray-600 uppercase tracking-widest block mb-1">
          Protocolo / Tipo
        </label>
        <select
          value={edge.data?.protocol ?? 'gpio'}
          onChange={e => onUpdate(edge.id, { protocol: e.target.value })}
          className="w-full px-2 py-1.5 rounded bg-gray-800 text-xs text-white
                     focus:outline-none focus:ring-1 focus:ring-gray-600"
          style={{ color: color }}
        >
          {PROTOCOLS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Protocol color preview */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }}/>
        <span className="text-[9px] text-gray-600">
          Fio renderizado na cor do protocolo
        </span>
      </div>
    </div>
  )
}

// ── Connection table ──────────────────────────────────────────────────────────

function TableTab({ nodes, edges }) {
  function exportCSV() {
    const header = 'Origem,Pino Origem,Destino,Pino Destino,Sinal,Protocolo'
    const rows   = buildRows(nodes, edges).map(r =>
      [r.from, r.fromPin, r.to, r.toPin, r.signal, r.protocol].join(',')
    )
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'conexoes.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (edges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-36 gap-2">
        <div className="text-2xl opacity-20">⇄</div>
        <p className="text-[10px] text-gray-700">Nenhuma conexão ainda</p>
      </div>
    )
  }

  const rows = buildRows(nodes, edges)

  return (
    <div className="p-3 space-y-2">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
        {edges.length} conexão{edges.length !== 1 ? 'ões' : ''}
      </div>

      <div className="space-y-1.5">
        {rows.map(row => (
          <div key={row.id}
               className="rounded-lg bg-gray-900 border border-gray-800 p-2 text-[9px]">
            <div className="flex items-center gap-1.5 mb-1.5">
              {row.signal
                ? <span className="font-semibold font-mono text-yellow-400">{row.signal}</span>
                : <span className="text-gray-700 italic">sem nome</span>}
              <span className="text-gray-700">·</span>
              <span className="text-gray-500">{PROTOCOLS.find(p => p.value === row.protocol)?.label ?? row.protocol}</span>
            </div>
            <div className="text-gray-400 leading-relaxed">
              <span className="text-gray-200">{row.from}</span>
              <span className="text-gray-600 mx-1 font-mono">{row.fromPin}</span>
              <span className="text-gray-700">→</span>
              <span className="text-gray-200 mx-1">{row.to}</span>
              <span className="text-gray-600 font-mono">{row.toPin}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={exportCSV}
        className="w-full mt-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700
                   text-xs text-gray-400 hover:text-gray-200 transition-colors">
        Exportar CSV
      </button>
    </div>
  )
}

function buildRows(nodes, edges) {
  return edges.map(edge => {
    const fromNode = nodes.find(n => n.id === edge.source)
    const toNode   = nodes.find(n => n.id === edge.target)
    const fromComp = COMPONENT_DEFS.find(c => c.id === fromNode?.data?.compId)
    const toComp   = COMPONENT_DEFS.find(c => c.id === toNode?.data?.compId)

    const allFrom = [...(fromComp?.leftPins ?? []), ...(fromComp?.rightPins ?? [])]
    const allTo   = [...(toComp?.leftPins   ?? []), ...(toComp?.rightPins   ?? [])]
    const fromPin = allFrom.find(p => p.id === edge.sourceHandle)
    const toPin   = allTo.find(p   => p.id === edge.targetHandle)

    return {
      id:       edge.id,
      from:     fromComp?.name  ?? '?',
      fromPin:  fromPin?.label  ?? (edge.sourceHandle ?? '?'),
      to:       toComp?.name    ?? '?',
      toPin:    toPin?.label    ?? (edge.targetHandle ?? '?'),
      signal:   edge.data?.signal   ?? '',
      protocol: edge.data?.protocol ?? 'gpio',
    }
  })
}
