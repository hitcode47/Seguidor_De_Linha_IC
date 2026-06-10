import { useMemo } from 'react'

// ── Átomo: KPI compacto ───────────────────────────────────────────────────────
function Kpi({ label, value, unit, accent = 'text-white', estimated }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{label}</span>
        {estimated && <span className="text-[9px] text-gray-700 font-mono">est.</span>}
      </div>
      <span className={`font-mono text-xl font-bold tabular-nums leading-none ${accent}`}>
        {value}
        {unit && <span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>}
      </span>
    </div>
  )
}

// ── Átomo: linha com barra ────────────────────────────────────────────────────
function BarRow({ label, value, unit = '', pct, color = '#3b82f6', estimated }) {
  const clamped = Math.min(1, Math.max(0, isNaN(pct) ? 0 : pct))
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">
          {label}
          {estimated && <span className="text-gray-700 ml-1 text-[9px]">est.</span>}
        </span>
        <span className="font-mono text-gray-200 tabular-nums">
          {value}<span className="text-gray-600 ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-100"
             style={{ width: `${clamped * 100}%`, backgroundColor: color }}/>
      </div>
    </div>
  )
}

// ── Seção: cabeçalho de grupo ─────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3 px-0.5">
        {title}
      </h3>
      {children}
    </div>
  )
}

// ── Motor ─────────────────────────────────────────────────────────────────────
function MotorCard({ label, speed }) {
  const pct     = Math.abs(speed) / 255
  const rpm     = Math.round(pct * 3000)
  const current = (pct * 2.4).toFixed(1)
  const duty    = Math.round(pct * 100)
  const col     = pct > 0.82 ? '#ef4444' : pct > 0.55 ? '#f59e0b' : '#22c55e'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
      <BarRow label="RPM"      value={rpm}     unit="rpm" pct={pct}       color={col} estimated/>
      <BarRow label="Corrente" value={current} unit="A"   pct={pct * 0.7} color={col} estimated/>
      <BarRow label="Duty"     value={duty}    unit="%"   pct={pct}       color={col}/>
    </div>
  )
}

// ── Sensores de linha ─────────────────────────────────────────────────────────
function SensorPanel({ sensors, position }) {
  const active = sensors.filter(Boolean).length
  const conf   = sensors.length > 0 ? active / sensors.length : 0
  const confCol = conf > 0.5 ? '#22c55e' : conf > 0.25 ? '#f59e0b' : '#ef4444'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Sensores de Linha
      </div>

      {/* Leitura individual */}
      <div className="flex gap-1">
        {sensors.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full rounded text-center text-[9px] font-mono font-bold py-2 transition-colors ${
              v ? 'bg-green-800/70 text-green-300' : 'bg-gray-800 text-gray-600'
            }`}>
              {i + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <BarRow label="Centro estimado" value={(position >= 0 ? '+' : '') + position.toFixed(3)}
                unit="" pct={(position + 1) / 2} color="#3b82f6"/>
        <BarRow label="Sensores ativos" value={active} unit={`/${sensors.length}`}
                pct={conf} color="#22c55e"/>
        <BarRow label="Confiança da leitura" value={Math.round(conf * 100)} unit="%"
                pct={conf} color={confCol}/>
      </div>
    </div>
  )
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ history, field, color, height = 44 }) {
  const pts = useMemo(() => {
    if (!history || history.length < 2) return ''
    const W = 300
    return history.map((d, i) => {
      const x = (i / (history.length - 1)) * W
      const y = height - ((d[field] + 1) / 2) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [history, field, height])

  const last  = history?.[history.length - 1]?.[field] ?? 0
  const lastY = height - ((last + 1) / 2) * height

  return (
    <svg viewBox={`0 0 300 ${height}`} width="100%" height={height} style={{ display: 'block' }}>
      <line x1={0} y1={height / 2} x2={300} y2={height / 2} stroke="#ffffff08" strokeWidth={1}/>
      {pts
        ? <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round"/>
        : <text x={150} y={height / 2 + 4} textAnchor="middle" fontSize={9} fill="#374151">aguardando dados</text>
      }
      {pts && <circle cx={300} cy={lastY} r={3} fill={color}/>}
    </svg>
  )
}

// ── Controlador ───────────────────────────────────────────────────────────────
function ControllerPanel({ pidOutput, position, leftSpeed, rightSpeed, history }) {
  const ey  = position
  const eth = (leftSpeed - rightSpeed) / 255   // proxy angular
  const sat = Math.abs(pidOutput) / 255
  const satCol = sat > 0.9 ? '#ef4444' : sat > 0.6 ? '#f59e0b' : '#22c55e'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Controlador
      </div>

      {/* Erros + Saída */}
      <div className="flex flex-col gap-3">
        <BarRow label="Erro lateral  eᵧ"   value={(ey  >= 0 ? '+' : '') + ey.toFixed(3)}
                unit="" pct={(ey  + 1) / 2} color="#3b82f6"/>
        <BarRow label="Erro angular  eθ"   value={(eth >= 0 ? '+' : '') + eth.toFixed(3)}
                unit="" pct={(eth + 1) / 2} color="#8b5cf6" estimated/>
        <BarRow label="Saída do controlador" value={pidOutput.toFixed(2)}
                unit="" pct={sat} color={satCol}/>
      </div>

      {/* Sparklines */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">
            Erro lateral — histórico
          </div>
          <div className="bg-gray-950 rounded-lg px-2 py-1">
            <Sparkline history={history} field="position" color="#3b82f6" height={40}/>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">
            Velocidade esq / dir
          </div>
          <div className="bg-gray-950 rounded-lg px-2 py-1">
            <Sparkline history={history} field="left"  color="#22c55e" height={32}/>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Painel principal ──────────────────────────────────────────────────────────
export default function Observability({ robot }) {
  const { sensors, position, leftSpeed, rightSpeed, pidOutput, lineDetected, history } = robot

  const totalI = ((Math.abs(leftSpeed) + Math.abs(rightSpeed)) / 255 * 4.8).toFixed(1)
  const deltaV = ((Math.abs(leftSpeed) + Math.abs(rightSpeed)) / 255 * 0.6).toFixed(2)
  const freq   = 100   // Hz nominal até firmware enviar

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">

      {/* ── Alimentação ─────────────────────────────────────────────── */}
      <Section title="Alimentação">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label="Tensão Bateria"    value="7.4"       unit="V"  accent="text-yellow-400"/>
          <Kpi label="Corrente Total"    value={totalI}    unit="A"  accent="text-orange-400" estimated/>
          <Kpi label="Ciclo de Controle" value={freq}      unit="Hz" accent="text-blue-400"/>
          <Kpi label="Linha"             value={lineDetected ? 'OK' : 'Perdida'}
               accent={lineDetected ? 'text-green-400' : 'text-red-400'}/>
        </div>
      </Section>

      {/* ── Motores ─────────────────────────────────────────────────── */}
      <Section title="Motores">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MotorCard label="Motor Esquerdo" speed={leftSpeed}/>
          <MotorCard label="Motor Direito"  speed={rightSpeed}/>
        </div>
      </Section>

      {/* ── Sensores + Controlador ──────────────────────────────────── */}
      <Section title="Sensores &amp; Controlador">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SensorPanel sensors={sensors} position={position}/>
          <ControllerPanel
            pidOutput={pidOutput ?? 0}
            position={position}
            leftSpeed={leftSpeed}
            rightSpeed={rightSpeed}
            history={history}
          />
        </div>
      </Section>

    </div>
  )
}
