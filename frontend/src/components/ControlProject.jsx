import { useState } from 'react'

// ── Metas do projeto de controle ─────────────────────────────────────────────
const GOALS = [
  {
    id: 1,
    title: 'Modelagem Matemática',
    subtitle: 'Cinemática do robô diferencial',
    status: 'active',
  },
  {
    id: 2,
    title: 'Identificação de Parâmetros',
    subtitle: 'Estimar r, L e kᵥ experimentalmente',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Projeto do Controlador',
    subtitle: 'PID para seguimento de linha',
    status: 'pending',
  },
  {
    id: 4,
    title: 'Análise de Estabilidade',
    subtitle: 'Lugar das raízes, margem de fase',
    status: 'pending',
  },
  {
    id: 5,
    title: 'Simulação Malha Fechada',
    subtitle: 'Validação modelo + controlador',
    status: 'pending',
  },
  {
    id: 6,
    title: 'Implementação e Validação',
    subtitle: 'Testes no hardware real',
    status: 'pending',
  },
]

const STATUS_STYLE = {
  done:    { dot: 'bg-green-500',  bar: 'bg-green-500',  text: 'text-white'   },
  active:  { dot: 'bg-blue-500 animate-pulse', bar: 'bg-blue-600', text: 'text-white' },
  pending: { dot: 'bg-gray-700',   bar: 'bg-gray-800',   text: 'text-gray-500' },
}

// ── Helpers de layout ─────────────────────────────────────────────────────────
function Section({ title, accent, children }) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
        {accent && <div className="w-1 h-4 rounded-full shrink-0" style={{ background: accent }}/>}
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function EqRow({ eq, note, accent = '#4ade80' }) {
  return (
    <div className="flex items-baseline gap-6 py-2 border-b border-gray-800/60 last:border-0">
      <code className="font-mono text-sm flex-1 leading-relaxed" style={{ color: accent }}>
        {eq}
      </code>
      {note && <span className="text-[10px] text-gray-600 shrink-0 max-w-[180px] text-right leading-snug">{note}</span>}
    </div>
  )
}

function Var({ name, def, unit, color = '#60a5fa' }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-gray-800/40 last:border-0">
      <code className="font-mono text-sm w-10 shrink-0 text-right" style={{ color }}>{name}</code>
      <span className="text-xs text-gray-400 flex-1 leading-snug">{def}</span>
      {unit && <code className="text-[10px] text-gray-600 shrink-0 font-mono">{unit}</code>}
    </div>
  )
}

// ── SVG: diagrama top-down do robô diferencial ────────────────────────────────
function RobotDiagram() {
  const W = 320, H = 210
  const cx = 155, cy = 105
  // corpo
  const bw = 86, bh = 52
  // rodas (esq = cima, dir = baixo quando indo para +x)
  const wx = cx - 28, ww = 56, wh = 13
  const ly = cy - bh / 2 - 8   // centro roda esquerda
  const ry = cy + bh / 2 + 8   // centro roda direita
  const L  = ry - ly            // distância entre centros (px)

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
         style={{ background: '#080e14', borderRadius: 10, display: 'block' }}>

      {/* Grade sutil */}
      {Array.from({ length: 9 },  (_, i) => (
        <line key={'gx'+i} x1={i*40} y1={0} x2={i*40} y2={H} stroke="#1a2535" strokeWidth="0.5"/>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={'gy'+i} x1={0} y1={i*42} x2={W} y2={i*42} stroke="#1a2535" strokeWidth="0.5"/>
      ))}

      {/* Eixo de referência global (canto inferior esquerdo) */}
      <g transform={`translate(30,${H-28})`}>
        {/* x */}
        <line x1={0} y1={0} x2={22} y2={0} stroke="#ef4444aa" strokeWidth={1}/>
        <polygon points="22,0 17,-3 17,3" fill="#ef4444aa"/>
        <text x={26} y={4} fill="#ef4444aa" fontSize={8} fontFamily="monospace">x</text>
        {/* y */}
        <line x1={0} y1={0} x2={0} y2={-22} stroke="#22c55eaa" strokeWidth={1}/>
        <polygon points="0,-22 -3,-17 3,-17" fill="#22c55eaa"/>
        <text x={4} y={-22} fill="#22c55eaa" fontSize={8} fontFamily="monospace">y</text>
      </g>

      {/* Sombra do corpo */}
      <rect x={cx - bw/2 + 2} y={cy - bh/2 + 2} width={bw} height={bh} rx={7}
            fill="#000" opacity={0.4}/>

      {/* Corpo do robô */}
      <rect x={cx - bw/2} y={cy - bh/2} width={bw} height={bh} rx={7}
            fill="#0d2818" stroke="#4ade8055" strokeWidth={1.5}/>

      {/* Sensores IR (linha de pontinhos na frente) */}
      {[-24,-16,-8,0,8,16,24].map((dx, i) => (
        <circle key={i} cx={cx + bw/2 - 6 + dx} cy={cy} r={1.5}
                fill="#22d3ee55" stroke="#22d3ee" strokeWidth={0.5}/>
      ))}
      <text x={cx + bw/2 + 3} y={cy + 4} fill="#22d3ee66" fontSize={7} fontFamily="monospace">sensores</text>

      {/* Centro geométrico */}
      <circle cx={cx} cy={cy} r={3} fill="#fde047" opacity={0.9}/>
      <text x={cx + 5} y={cy - 5} fill="#fde04799" fontSize={8} fontFamily="monospace">O</text>

      {/* Orientação θ (arco + label) */}
      <path d={`M ${cx+18} ${cy} A 18 18 0 0 0 ${cx + 18*Math.cos(-0.5)} ${cy + 18*Math.sin(-0.5)}`}
            fill="none" stroke="#fbbf2466" strokeWidth={1} strokeDasharray="2,2"/>
      <text x={cx+24} y={cy-6} fill="#fbbf2499" fontSize={8} fontFamily="monospace">θ</text>

      {/* Seta de direção (forward = +x) */}
      <defs>
        <marker id="ah-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0,1 5,3 0,5" fill="#4ade80cc"/>
        </marker>
        <marker id="ah-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0,1 5,3 0,5" fill="#60a5fa"/>
        </marker>
        <marker id="ah-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0,1 5,3 0,5" fill="#f97316"/>
        </marker>
      </defs>
      <line x1={cx + bw/2} y1={cy} x2={cx + bw/2 + 28} y2={cy}
            stroke="#4ade80cc" strokeWidth={1.5} markerEnd="url(#ah-green)"/>
      <text x={cx + bw/2 + 36} y={cy + 4} fill="#4ade80aa" fontSize={8} fontFamily="monospace">v</text>

      {/* Roda esquerda (topo) */}
      <rect x={wx} y={ly - wh/2} width={ww} height={wh} rx={3}
            fill="#1f2937" stroke="#9ca3af70" strokeWidth={1}/>
      {/* vL arrow */}
      <line x1={wx + ww} y1={ly} x2={cx + bw/2 + 6} y2={ly}
            stroke="#60a5fa" strokeWidth={1.5} markerEnd="url(#ah-blue)"/>
      <text x={cx + bw/2 + 14} y={ly + 4} fill="#60a5fa" fontSize={9} fontFamily="monospace">vL</text>

      {/* Roda direita (base) */}
      <rect x={wx} y={ry - wh/2} width={ww} height={wh} rx={3}
            fill="#1f2937" stroke="#9ca3af70" strokeWidth={1}/>
      {/* vR arrow */}
      <line x1={wx + ww} y1={ry} x2={cx + bw/2 + 6} y2={ry}
            stroke="#f97316" strokeWidth={1.5} markerEnd="url(#ah-orange)"/>
      <text x={cx + bw/2 + 14} y={ry + 4} fill="#f97316" fontSize={9} fontFamily="monospace">vR</text>

      {/* Dimensão L (seta dupla entre rodas) */}
      <line x1={wx - 20} y1={ly} x2={wx - 20} y2={ry}
            stroke="#9ca3af50" strokeWidth={0.8} strokeDasharray="3,2"/>
      <line x1={wx - 24} y1={ly} x2={wx - 16} y2={ly}
            stroke="#9ca3af70" strokeWidth={0.8}/>
      <line x1={wx - 24} y1={ry} x2={wx - 16} y2={ry}
            stroke="#9ca3af70" strokeWidth={0.8}/>
      <text x={wx - 34} y={cy + 4} fill="#9ca3af99" fontSize={9} fontFamily="monospace">L</text>

      {/* Dimensão r (raio da roda) */}
      <line x1={wx} y1={ly} x2={wx + ww/2} y2={ly}
            stroke="#fbbf2455" strokeWidth={0.8} strokeDasharray="2,2"/>
      <text x={wx + 2} y={ly - 8} fill="#fbbf2499" fontSize={8} fontFamily="monospace">r</text>

      {/* Labels rodas */}
      <text x={wx - 14} y={ly + 4} fill="#60a5fa88" fontSize={8} fontFamily="monospace" textAnchor="end">Esq.</text>
      <text x={wx - 14} y={ry + 4} fill="#f9731688" fontSize={8} fontFamily="monospace" textAnchor="end">Dir.</text>
    </svg>
  )
}

// ── Conteúdo: Meta 1 — Modelagem Matemática ──────────────────────────────────
function GoalModelagem() {
  return (
    <div className="space-y-4">

      {/* Header da meta */}
      <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest">Meta 1</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
            </div>
            <h2 className="text-base font-bold text-white">Modelagem Matemática</h2>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-xl">
              Obter um modelo que relacione as velocidades angulares de cada roda com a velocidade
              linear e angular do robô — base para o projeto do controlador.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-900/50 text-blue-400 shrink-0">
            Em andamento
          </span>
        </div>
      </div>

      {/* Diagrama + Parâmetros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <Section title="Diagrama — Vista Superior" accent="#4ade80">
          <RobotDiagram />
          <p className="text-[10px] text-gray-600 mt-3 text-center">
            Robô diferencial: duas rodas motorizadas independentes no mesmo eixo
          </p>
        </Section>

        <Section title="Parâmetros do Modelo" accent="#fbbf24">
          <div className="mb-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Geometria</p>
            <Var name="r"  color="#fbbf24" def="Raio da roda"                      unit="m"   />
            <Var name="L"  color="#fbbf24" def="Distância entre centros das rodas" unit="m"   />
          </div>
          <div className="mb-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 mt-4">Velocidades das rodas</p>
            <Var name="vL" color="#60a5fa" def="Velocidade linear da roda esquerda" unit="m/s" />
            <Var name="vR" color="#f97316" def="Velocidade linear da roda direita"  unit="m/s" />
            <Var name="ωL" color="#60a5fa" def="Velocidade angular roda esquerda"   unit="rad/s"/>
            <Var name="ωR" color="#f97316" def="Velocidade angular roda direita"    unit="rad/s"/>
          </div>
          <div className="mb-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 mt-4">Saída do modelo</p>
            <Var name="v"  color="#4ade80" def="Velocidade linear do robô"          unit="m/s"   />
            <Var name="ω"  color="#4ade80" def="Velocidade angular do robô"         unit="rad/s" />
          </div>
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 mt-4">Pose (estado)</p>
            <Var name="x"  color="#c084fc" def="Posição horizontal no plano"        unit="m"   />
            <Var name="y"  color="#c084fc" def="Posição vertical no plano"          unit="m"   />
            <Var name="θ"  color="#c084fc" def="Orientação (ângulo de heading)"     unit="rad" />
          </div>
        </Section>
      </div>

      {/* Cinemática diferencial */}
      <Section title="1 · Cinemática Diferencial" accent="#4ade80">
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Para uma roda de raio <code className="text-yellow-400 font-mono">r</code>, a velocidade
          linear é <code className="text-yellow-400 font-mono">v = r·ω</code>. Combinando as duas rodas:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Velocidade linear da roda</p>
            <EqRow eq="vL = r · ωL" note="roda esquerda" accent="#60a5fa"/>
            <EqRow eq="vR = r · ωR" note="roda direita"  accent="#f97316"/>
          </div>
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Saída do robô</p>
            <EqRow eq="v = (vL + vR) / 2"    note="velocidade linear → média das rodas"   accent="#4ade80"/>
            <EqRow eq="ω = (vR − vL) / L"    note="velocidade angular → diferença / base" accent="#4ade80"/>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Inversamente — de (v, ω) para as rodas</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <EqRow eq="vL = v − ω·L/2" note="velocidade da roda esquerda" accent="#60a5fa"/>
            <EqRow eq="vR = v + ω·L/2" note="velocidade da roda direita"  accent="#f97316"/>
          </div>
        </div>
      </Section>

      {/* Modelo de estado */}
      <Section title="2 · Modelo de Estado — Pose do Robô" accent="#c084fc">
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          O estado do robô no plano é definido pelo vetor de pose{' '}
          <code className="text-purple-400 font-mono">[x, y, θ]ᵀ</code>. As equações de
          movimento (cinemática não-linear) são:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Equações diferenciais</p>
            <EqRow eq="ẋ = v · cos(θ)" note="variação da posição x"  accent="#c084fc"/>
            <EqRow eq="ẏ = v · sin(θ)" note="variação da posição y"  accent="#c084fc"/>
            <EqRow eq="θ̇ = ω"          note="variação da orientação" accent="#c084fc"/>
          </div>
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Forma matricial</p>
            <div className="font-mono text-sm text-purple-400 leading-loose bg-gray-800/60 rounded-lg p-3">
              <div>d/dt [x ]   [cos θ  0] [v]</div>
              <div className="ml-12">     [y ] = [sin θ  0]·[ω]</div>
              <div className="ml-12">     [θ ]   [0      1]</div>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">
              Sistema não-linear — a matriz depende de θ
            </p>
          </div>
        </div>

        {/* Linearização */}
        <div className="mt-4 p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">
            Linearização em torno de trajetória reta (θ ≈ 0)
          </p>
          <p className="text-[10px] text-gray-500 mb-2">
            Para pequenas variações de ângulo, <code className="text-purple-400 font-mono">cos θ ≈ 1</code>,{' '}
            <code className="text-purple-400 font-mono">sin θ ≈ θ</code>:
          </p>
          <EqRow eq="ẋ ≈ v"    note="movimento dominante em x"      accent="#c084fc"/>
          <EqRow eq="ẏ ≈ v · θ" note="desvio lateral ← acoplado"   accent="#c084fc"/>
          <EqRow eq="θ̇ = ω"    note="controlável diretamente"       accent="#c084fc"/>
        </div>
      </Section>

      {/* PWM → Velocidade */}
      <Section title="3 · Mapeamento PWM → Velocidade" accent="#fde047">
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          O ESP32-S3 controla o L298N via PWM (0 – 255). Assumindo modelo linear
          entre duty cycle e velocidade da roda:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Modelo de atuação</p>
            <EqRow eq="vL = kᵥ · (PWML / 255)"  note="kᵥ = velocidade máxima (m/s)" accent="#fde047"/>
            <EqRow eq="vR = kᵥ · (PWMR / 255)"  note="parâmetro a identificar"      accent="#fde047"/>
          </div>
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Modelo completo</p>
            <EqRow eq="v = (kᵥ/2) · (PWML + PWMR) / 255" note="velocidade linear resultante"  accent="#4ade80"/>
            <EqRow eq="ω = (kᵥ/L) · (PWMR − PWML) / 255" note="velocidade angular resultante" accent="#4ade80"/>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-amber-900/10 border border-amber-800/30">
          <p className="text-[10px] text-amber-600 uppercase tracking-widest mb-1">Hipóteses simplificadoras</p>
          <ul className="text-[10px] text-gray-500 space-y-0.5 list-disc list-inside">
            <li>Modelo linear — válido fora da zona morta e da saturação do PWM</li>
            <li>Sem escorregamento das rodas — superfície com atrito suficiente</li>
            <li>kᵥ igual para ambas as rodas — pode haver assimetria na prática</li>
          </ul>
        </div>
      </Section>

      {/* Diagrama de blocos */}
      <Section title="4 · Diagrama de Blocos — Visão Geral" accent="#22d3ee">
        <div className="overflow-x-auto">
          <BlockDiagram />
        </div>
      </Section>

      {/* Próximos passos */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">Próximos passos → Meta 2</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'Medir r e L', desc: 'Régua + paquímetro no robô físico' },
            { label: 'Identificar kᵥ', desc: 'Teste de rampa: medir velocidade para vários PWM' },
            { label: 'Validar assimetria', desc: 'Comparar kᵥL vs kᵥR e calibrar offset' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-lg bg-gray-800 border border-gray-700/50">
              <p className="text-xs font-semibold text-gray-300 mb-1">{s.label}</p>
              <p className="text-[10px] text-gray-600 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ── Diagrama de blocos simplificado (SVG) ─────────────────────────────────────
function BlockDiagram() {
  const H = 110
  const W = 680

  const boxes = [
    { x: 10,  y: 35, w: 90,  h: 40, label: ['Setpoint', 'v*, ω*'],     color: '#1e3a5f', border: '#60a5fa' },
    { x: 130, y: 35, w: 90,  h: 40, label: ['Controlador', 'PID'],      color: '#4a1d96', border: '#c084fc' },
    { x: 250, y: 35, w: 100, h: 40, label: ['PWM → vL,vR', 'L298N'],    color: '#78350f', border: '#fbbf24' },
    { x: 380, y: 35, w: 100, h: 40, label: ['Cinemática', 'diferencial'], color: '#064e3b', border: '#4ade80' },
    { x: 510, y: 35, w: 100, h: 40, label: ['Pose', 'x, y, θ'],         color: '#312e81', border: '#818cf8' },
  ]

  const arrows = [
    [100, 55, 130, 55],
    [220, 55, 250, 55],
    [350, 55, 380, 55],
    [480, 55, 510, 55],
  ]

  // feedback arrow
  const fbX1 = 560, fbX2 = 70, fbY = 85, fbY2 = 55

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
         style={{ background: '#080e14', borderRadius: 10, display: 'block', minWidth: 500 }}>
      <defs>
        <marker id="bd-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0,1 5,3 0,5" fill="#9ca3af"/>
        </marker>
      </defs>

      {/* Blocos */}
      {boxes.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={5}
                fill={b.color} stroke={b.border} strokeWidth={1}/>
          {b.label.map((l, j) => (
            <text key={j} x={b.x + b.w/2} y={b.y + 16 + j*14}
                  textAnchor="middle" fill={j === 0 ? '#f9fafb' : b.border}
                  fontSize={j === 0 ? 9 : 8} fontFamily="monospace">{l}</text>
          ))}
        </g>
      ))}

      {/* Setas entre blocos */}
      {arrows.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#9ca3af" strokeWidth={1.2} markerEnd="url(#bd-arrow)"/>
      ))}

      {/* Feedback (saída → entrada) */}
      <path d={`M ${fbX1} 75 L ${fbX1} ${fbY} L ${fbX2} ${fbY} L ${fbX2} ${fbY2}`}
            fill="none" stroke="#9ca3af50" strokeWidth={1.2} strokeDasharray="4,3"
            markerEnd="url(#bd-arrow)"/>
      <text x={(fbX1 + fbX2)/2} y={fbY + 12} textAnchor="middle"
            fill="#9ca3af50" fontSize={8} fontFamily="monospace">realimentação</text>

      {/* Label saída */}
      <text x={615} y={59} fill="#818cf8aa" fontSize={8} fontFamily="monospace">saída</text>
    </svg>
  )
}

// ── Conteúdo placeholder para metas futuras ───────────────────────────────────
function GoalPending({ goal }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-2xl text-gray-700">
        {goal.id}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-500">{goal.title}</h2>
        <p className="text-xs text-gray-700 mt-1">{goal.subtitle}</p>
      </div>
      <p className="text-[11px] text-gray-700">Disponível após concluir a meta anterior</p>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ControlProject() {
  const [activeId, setActiveId] = useState(1)
  const activeGoal = GOALS.find(g => g.id === activeId)

  return (
    <div className="flex gap-0" style={{ minHeight: 'calc(100vh - 130px)' }}>

      {/* Sidebar de metas */}
      <aside className="w-56 shrink-0 border-r border-gray-800 flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
            Projeto de Controle
          </p>
        </div>

        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {GOALS.map((g, i) => {
            const style = STATUS_STYLE[g.status] ?? STATUS_STYLE.pending
            const isActive = g.id === activeId
            return (
              <button key={g.id}
                onClick={() => setActiveId(g.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group ${
                  isActive
                    ? 'bg-gray-800 border border-gray-700'
                    : 'hover:bg-gray-900 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${style.dot}`}/>
                  <div className="min-w-0">
                    <div className={`text-[10px] font-semibold ${
                      isActive ? 'text-white' : style.text
                    } leading-tight`}>
                      {g.title}
                    </div>
                    <div className="text-[9px] text-gray-600 mt-0.5 leading-snug">
                      {g.subtitle}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Progresso */}
        <div className="px-4 py-3 border-t border-gray-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-gray-700 uppercase tracking-widest">Progresso</span>
            <span className="text-[9px] text-gray-600">
              {GOALS.filter(g => g.status === 'done').length}/{GOALS.length}
            </span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all"
                 style={{ width: `${GOALS.filter(g => g.status === 'done').length / GOALS.length * 100}%` }}/>
          </div>
        </div>
      </aside>

      {/* Conteúdo da meta */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeGoal?.status === 'active' || activeGoal?.status === 'done'
          ? <GoalModelagem />
          : <GoalPending goal={activeGoal} />
        }
      </div>
    </div>
  )
}
