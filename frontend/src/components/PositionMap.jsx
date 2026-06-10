// Bird's-eye view: robô sobre a linha alvo
// Lateral  → translação esquerda/direita
// Angular  → rotação (estimada pelo diferencial de velocidade)

const SVG_W  = 280
const SVG_H  = 200
const CX     = SVG_W / 2
const CY     = SVG_H / 2 + 10

const R_W    = 48   // largura do corpo (px)
const R_H    = 68   // comprimento do corpo (px)
const S_H    = 8    // altura da barra de sensores (px)

const LAT_RANGE = SVG_W / 2 - R_W / 2 - 20   // máximo px de deslocamento lateral

function errorColor(absLat, absAng) {
  if (absLat < 0.15 && absAng < 4)  return '#22c55e'
  if (absLat < 0.55 && absAng < 18) return '#f59e0b'
  return '#ef4444'
}

export default function PositionMap({ position = 0, leftSpeed = 0, rightSpeed = 0, lineDetected = false }) {
  const lat   = Math.max(-1, Math.min(1, isNaN(position) ? 0 : position))
  const latPx = lat * LAT_RANGE

  // Estimativa angular pelo diferencial de motores (±25° max)
  const diff     = (leftSpeed - rightSpeed) / 255
  const angleDeg = diff * 25

  const col      = errorColor(Math.abs(lat), Math.abs(angleDeg))
  const lineOpacity = lineDetected ? 0.55 : 0.18

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Posicionamento
        </h2>
        <div className="flex gap-4 text-xs font-mono text-gray-500">
          <span>lat <span className="text-gray-200">{lat >= 0 ? '+' : ''}{lat.toFixed(2)}</span></span>
          <span>ang <span className="text-gray-200">{angleDeg >= 0 ? '+' : ''}{angleDeg.toFixed(1)}°</span></span>
        </div>
      </div>

      {/* SVG cena */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <filter id="pm-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b"/>
            <feFlood floodColor={col} floodOpacity="0.65" result="c"/>
            <feComposite in="c" in2="b" operator="in" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="pm-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1a10"/>
            <stop offset="100%" stopColor="#08110a"/>
          </linearGradient>
        </defs>

        {/* Fundo */}
        <rect width={SVG_W} height={SVG_H} fill="url(#pm-bg)" rx={8}/>

        {/* Grade sutil */}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`}
            x1={0} y1={12 + i * 22} x2={SVG_W} y2={12 + i * 22}
            stroke="#ffffff05" strokeWidth={1}/>
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`v${i}`}
            x1={20 + i * 40} y1={0} x2={20 + i * 40} y2={SVG_H}
            stroke="#ffffff05" strokeWidth={1}/>
        ))}

        {/* Linha alvo (vertical, centro) */}
        <line x1={CX} y1={6} x2={CX} y2={SVG_H - 6}
              stroke="#22c55e" strokeWidth={2.5} opacity={lineOpacity}/>

        {/* Ticks de referência na linha */}
        {[30, 60, 90, 120, 150, 170].map(y => (
          <line key={y} x1={CX - 5} y1={y} x2={CX + 5} y2={y}
                stroke="#22c55e" strokeWidth={1} opacity={lineOpacity * 0.8}/>
        ))}

        {/* Guia de deslocamento lateral (tracejado âmbar) */}
        {Math.abs(latPx) > 5 && (
          <line
            x1={CX} y1={CY}
            x2={CX + latPx} y2={CY}
            stroke="#f59e0b" strokeWidth={1}
            strokeDasharray="4 3" opacity={0.4}
          />
        )}

        {/* Robô */}
        <g transform={`translate(${CX + latPx}, ${CY}) rotate(${angleDeg})`}
           filter="url(#pm-glow)">

          {/* Rodas */}
          {[-1, 1].map(side => (
            <rect key={side}
              x={side === -1 ? -R_W / 2 - 6 : R_W / 2}
              y={-R_H / 2 + 10}
              width={6} height={R_H - 22}
              fill="#1e293b" stroke="#334155" strokeWidth={1} rx={2}/>
          ))}

          {/* Corpo */}
          <rect x={-R_W / 2} y={-R_H / 2} width={R_W} height={R_H}
                fill="#122018" stroke={col} strokeWidth={1.5} rx={5}/>

          {/* Faixa traseira (topo) */}
          <rect x={-R_W / 2 + 4} y={-R_H / 2 + 3} width={R_W - 8} height={4}
                fill={col} opacity={0.25} rx={1}/>

          {/* Seta de direção (aponta para baixo = frente do robô) */}
          <path d={`M 0,${-R_H / 2 + 18} L 7,${-R_H / 2 + 30} L 0,${-R_H / 2 + 26} L -7,${-R_H / 2 + 30} Z`}
                fill={col} opacity={0.7}/>

          {/* Ponto central */}
          <circle cx={0} cy={0} r={3} fill={col} opacity={0.65}/>

          {/* Barra de sensores (frente = baixo) */}
          <rect x={-R_W / 2 + 3} y={R_H / 2 - S_H - 2} width={R_W - 6} height={S_H}
                fill="#091410" stroke={col} strokeWidth={1} rx={2}/>

          {/* Pontos dos sensores */}
          {[-15, -9, -3, 3, 9, 15].map(dx => (
            <circle key={dx}
              cx={dx} cy={R_H / 2 - S_H / 2 - 2} r={2}
              fill={col} opacity={0.55}/>
          ))}
        </g>
      </svg>

      {/* Barras de erro */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {[
          { label: 'Deslocamento Lateral', val: lat,               range: 1,  unit: '',   fmt: v => (v >= 0 ? '+' : '') + v.toFixed(2) },
          { label: 'Deslocamento Angular', val: angleDeg / 25,     range: 1,  unit: '°',  fmt: v => (angleDeg >= 0 ? '+' : '') + angleDeg.toFixed(1) + '°' },
        ].map(({ label, val, fmt }) => (
          <div key={label}>
            <div className="text-xs text-gray-500 mb-1.5">{label}</div>
            <div className="relative h-1.5 bg-gray-800 rounded-full">
              <div className="absolute inset-y-0 left-1/2 w-px bg-gray-600"/>
              <div
                className="absolute w-2 h-2 rounded-full -top-[2px]"
                style={{
                  backgroundColor: col,
                  boxShadow: `0 0 5px ${col}`,
                  left: `calc(50% + ${val * 44}% - 4px)`,
                  transition: 'left 0.12s ease-out, background-color 0.3s',
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-700">−</span>
              <span className="font-mono" style={{ color: col }}>{fmt(val)}</span>
              <span className="text-gray-700">+</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
