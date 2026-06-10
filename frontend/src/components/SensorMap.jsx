import { useState } from 'react'
import { MM, SW_MM, SH_MM } from '../constants/sensorGrid'

// Padding fixo ao redor da área dos sensores (px)
const PAD = 14 * MM

// Conversão mm → px no SVG (independe de boardW/boardH — só usa PAD e MM)
const gx = x => PAD + x * MM
const gy = y => PAD + y * MM

// Dimensões físicas do componente SMD (px) — constantes, não dependem do boardW/H
const BW = SW_MM * MM
const BH = SH_MM * MM
const PH = 3.5 * MM

// ─── Filtros e gradientes SVG ─────────────────────────────────────────────────
function PcbDefs() {
  return (
    <defs>
      {/* Glow verde para sensor ativo */}
      <filter id="sm-glow-green" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b"/>
        <feFlood floodColor="#22c55e" floodOpacity="0.85" result="c"/>
        <feComposite in="c" in2="b" operator="in" result="g"/>
        <feMerge>
          <feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      {/* Glow âmbar para indicador de posição */}
      <filter id="sm-glow-amber" x="-120%" y="-120%" width="340%" height="340%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b"/>
        <feFlood floodColor="#f59e0b" floodOpacity="1" result="c"/>
        <feComposite in="c" in2="b" operator="in" result="g"/>
        <feMerge>
          <feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      {/* Gradiente de cobre (pad / trilha) */}
      <linearGradient id="sm-copper" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#e8a848"/>
        <stop offset="45%"  stopColor="#c87030"/>
        <stop offset="100%" stopColor="#9a5520"/>
      </linearGradient>

      {/* Gradiente horizontal para trilha de bus */}
      <linearGradient id="sm-copper-h" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#a86020"/>
        <stop offset="30%"  stopColor="#d88030"/>
        <stop offset="70%"  stopColor="#d88030"/>
        <stop offset="100%" stopColor="#a86020"/>
      </linearGradient>

      {/* Fundo da placa PCB */}
      <linearGradient id="sm-board" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#112a17"/>
        <stop offset="100%" stopColor="#091408"/>
      </linearGradient>

      {/* Área ativa (solder mask) */}
      <linearGradient id="sm-mask" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%"   stopColor="#0f2d16"/>
        <stop offset="100%" stopColor="#0a1e0d"/>
      </linearGradient>
    </defs>
  )
}

// ─── Fiducial PCB (marca de alinhamento) ──────────────────────────────────────
function Fiducial({ x, y }) {
  return (
    <g opacity="0.3">
      <circle cx={x} cy={y} r={7} fill="none" stroke="#7ab880" strokeWidth="0.8"/>
      <circle cx={x} cy={y} r={2.5} fill="#7ab880"/>
      <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke="#7ab880" strokeWidth="0.5"/>
      <line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke="#7ab880" strokeWidth="0.5"/>
    </g>
  )
}

// ─── Via (furo metalizado) ────────────────────────────────────────────────────
function Via({ x, y, r = 3.5 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="url(#sm-copper)"/>
      <circle cx={x} cy={y} r={r * 0.44} fill="#091408"/>
    </g>
  )
}

// ─── Sensor SMD (somente leitura) ─────────────────────────────────────────────
function PcbSensor({ sensor, index, active }) {
  const cx = gx(sensor.x)
  const cy = gy(sensor.y)
  const topPadY = cy - BH / 2 - PH

  return (
    <g filter={active ? 'url(#sm-glow-green)' : undefined}>
      {/* Pad superior */}
      <rect x={cx - BW / 2} y={topPadY} width={BW} height={PH}
            fill="url(#sm-copper)" rx={1}/>
      {/* Pad inferior */}
      <rect x={cx - BW / 2} y={cy + BH / 2} width={BW} height={PH}
            fill="url(#sm-copper)" rx={1}/>

      {/* Corpo do IC */}
      <rect x={cx - BW / 2} y={cy - BH / 2} width={BW} height={BH}
            fill={active ? '#0c2c12' : '#0a1c0d'}
            stroke={active ? '#22c55e' : '#1c5028'}
            strokeWidth={active ? 1.5 : 1} rx={2}/>

      {/* Faixa de polaridade */}
      <rect x={cx - BW / 2} y={cy - BH / 2} width={BW} height={5}
            fill={active ? '#15602e' : '#163824'} rx={2}/>

      {/* Indicador de pino 1 */}
      <circle cx={cx + BW / 2 - 5} cy={cy - BH / 2 + 5.5} r={4}
              fill="#071208" stroke="#1e5030" strokeWidth="0.5"/>
      <text x={cx + BW / 2 - 5} y={cy - BH / 2 + 8.5}
            textAnchor="middle" fontSize="5" fontFamily="monospace"
            fill={active ? '#4ade80' : '#2a5a38'}>
        {index + 1}
      </text>

      {/* Label silkscreen */}
      <text x={cx} y={cy + 3}
            textAnchor="middle" fontSize="8"
            fill={active ? '#86efac' : '#5a9468'}
            fontWeight="bold" fontFamily="monospace">
        {sensor.label}
      </text>

      {/* LED IR emissão (vermelho) */}
      <circle cx={cx - 5} cy={cy + BH / 2 - 5} r={2.8}
              fill={active ? '#4d1010' : '#200808'}
              stroke={active ? '#f87171' : '#7f1d1d'} strokeWidth="0.8"/>
      {/* LED IR recepção (verde) */}
      <circle cx={cx + 5} cy={cy + BH / 2 - 5} r={2.8}
              fill={active ? '#103d18' : '#081408'}
              stroke={active ? '#4ade80' : '#14532d'} strokeWidth="0.8"/>
    </g>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SensorMap({ sensors, sensorLayout, position, lineDetected, boardW = 220, boardH = 110 }) {
  const [hovered, setHovered] = useState(false)

  // Dimensões do SVG dependem das dimensões da placa
  const MAP_W = boardW * MM + 2 * PAD
  const MAP_H = boardH * MM + 2 * PAD

  if (!sensorLayout || sensorLayout.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
        <p className="text-xs text-gray-600">
          Configure e aplique sensores no{' '}
          <strong className="text-gray-500">Editor de Sensores</strong>
        </p>
      </div>
    )
  }

  const safePos = Math.max(-1, Math.min(1, isNaN(position) ? 0 : position))
  const first   = sensorLayout[0]
  const last    = sensorLayout[sensorLayout.length - 1]
  const t       = (safePos + 1) / 2

  // Bus horizontal: abaixo do sensor mais baixo (maior Y SVG)
  const maxBottom = Math.max(...sensorLayout.map(s => gy(s.y) + BH / 2 + PH))
  const busY      = Math.min(maxBottom + 6 * MM, MAP_H - 18 * MM)

  // Indicador de posição sobre o bus
  const busX1 = gx(first.x)
  const busX2 = gx(last.x)
  const dotX  = busX1 + t * (busX2 - busX1)

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Mapa IR · PCB
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 font-mono">
            pos {safePos >= 0 ? '+' : ''}{safePos.toFixed(2)}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            lineDetected
              ? 'bg-green-900/60 text-green-400'
              : 'bg-red-900/60 text-red-400'
          }`}>
            {lineDetected ? 'Linha detectada' : 'Sem linha'}
          </span>
        </div>
      </div>

      {/* Wrapper 2.5D — perspectiva CSS */}
      <div style={{ perspective: '900px', perspectiveOrigin: '50% 5%', paddingBottom: '24px' }}>
        <div
          style={{
            transform: `rotateX(${hovered ? 5 : 14}deg) rotateY(${hovered ? 0 : -2}deg)`,
            transformOrigin: 'center 40%',
            transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: hovered
              ? '0 14px 40px rgba(0,0,0,0.85), 0 0 24px rgba(10,80,30,0.45)'
              : '0 30px 80px rgba(0,0,0,0.97), 0 0 60px rgba(10,70,25,0.5)',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            width="100%"
            style={{ display: 'block', maxWidth: MAP_W }}
            preserveAspectRatio="xMidYMid meet"
          >
            <PcbDefs/>

            {/* ── Placa base ────────────────────────────────────────────── */}
            <rect x={0} y={0} width={MAP_W} height={MAP_H}
                  fill="url(#sm-board)" rx={8}/>

            {/* Solder mask (área interna) */}
            <rect x={5} y={5} width={MAP_W - 10} height={MAP_H - 10}
                  fill="url(#sm-mask)" rx={6}
                  stroke="#1d5030" strokeWidth="0.6"/>

            {/* Edge highlight sutil */}
            <rect x={0} y={0} width={MAP_W} height={MAP_H}
                  fill="none" rx={8}
                  stroke="#2d6840" strokeWidth="1.5" opacity="0.5"/>

            {/* ── Fiducials (3 cantos — padrão SMT) ─────────────────────── */}
            <Fiducial x={PAD * 0.55} y={PAD * 0.55}/>
            <Fiducial x={MAP_W - PAD * 0.55} y={PAD * 0.55}/>
            <Fiducial x={PAD * 0.55} y={MAP_H - PAD * 0.55}/>

            {/* ── Silkscreen — marcações da placa ───────────────────────── */}
            <text x={MAP_W / 2} y={14}
                  textAnchor="middle" fontSize="7.5" letterSpacing="4"
                  fontFamily="monospace" fill="#1e5a2a">
              IR SENSOR ARRAY
            </text>
            <text x={MAP_W - 10} y={MAP_H - 7}
                  textAnchor="end" fontSize="5.5"
                  fontFamily="monospace" fill="#163820">
              REV 1.0
            </text>
            <text x={10} y={MAP_H - 7}
                  fontSize="5.5" fontFamily="monospace" fill="#163820">
              {sensorLayout.length}× IR
            </text>

            {/* ── Bus horizontal (trilha principal) ─────────────────────── */}
            <line
              x1={busX1} y1={busY}
              x2={busX2} y2={busY}
              stroke="url(#sm-copper-h)"
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Pads de terminação do bus */}
            <Via x={busX1} y={busY} r={4}/>
            <Via x={busX2} y={busY} r={4}/>

            {/* ── Stubs: sensor → bus ───────────────────────────────────── */}
            {sensorLayout.map(s => {
              const cx       = gx(s.x)
              const padBotY  = gy(s.y) + BH / 2 + PH
              const startY   = padBotY < busY ? padBotY : gy(s.y) - BH / 2
              return (
                <g key={`stub-${s.id}`}>
                  <line x1={cx} y1={startY} x2={cx} y2={busY}
                        stroke="url(#sm-copper)"
                        strokeWidth="1.8" strokeLinecap="round"/>
                  <Via x={cx} y={busY} r={3}/>
                </g>
              )
            })}

            {/* ── Componentes sensores ──────────────────────────────────── */}
            {sensorLayout.map((s, i) => (
              <PcbSensor
                key={s.id}
                sensor={s}
                index={i}
                active={sensors[i] === 1}
              />
            ))}

            {/* ── Indicador de posição (LED âmbar no bus) ───────────────── */}
            {sensorLayout.length >= 2 && (
              <g filter="url(#sm-glow-amber)">
                <circle cx={dotX} cy={busY} r={6}   fill="#f59e0b"/>
                <circle cx={dotX} cy={busY} r={2.5} fill="#fef3c7"/>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  )
}
