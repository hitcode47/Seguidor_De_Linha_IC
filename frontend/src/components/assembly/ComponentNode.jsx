import { Handle, Position } from '@xyflow/react'
import { COMPONENT_DEFS, PIN_TYPES, CATEGORIES } from '../../data/componentLibrary'

const HEADER_H = 42
const ROW_H    = 16
const FOOTER_H = 10

function pinTopPct(i, sideLen, maxPins, nodeH) {
  const offset = ((maxPins - sideLen) / 2) * ROW_H
  const topPx  = HEADER_H + offset + (i + 0.5) * ROW_H
  return (topPx / nodeH * 100).toFixed(2) + '%'
}

// ── Decorative center SVG per component ────────────────────────────────────
function ChipDecal({ compId, nodeW, nodeH, accentColor }) {
  const cx   = nodeW / 2
  const cy   = nodeH / 2 + HEADER_H / 2
  const padL = 68
  const cw   = Math.max(nodeW - padL * 2, 10)
  const ch   = Math.min(nodeH - HEADER_H - FOOTER_H - 10, 72)
  const x    = padL
  const y    = cy - ch / 2

  const faint = accentColor + '30'
  const mid   = accentColor + '70'
  const bright = accentColor + 'cc'

  switch (compId) {
    case 'esp32s3':
      return (
        <svg style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }} width={nodeW} height={nodeH}>
          <rect x={x} y={y} width={cw} height={ch} rx={3} fill="#111827" stroke={faint} strokeWidth={0.5}/>
          <rect x={x+3} y={y+3} width={cw-6} height={ch-6} rx={2} fill="#0d1117"/>
          <text x={cx} y={cy - 4} textAnchor="middle" fill={bright} fontSize={7} fontFamily="monospace" fontWeight="bold">ESP32-S3</text>
          <text x={cx} y={cy + 6} textAnchor="middle" fill={mid} fontSize={5.5} fontFamily="monospace">WROOM-1</text>
          <rect x={cx-5} y={y+ch-7} width={10} height={4} rx={1} fill={faint}/>
          {/* WiFi symbol */}
          {[6,4,2].map((r,i) => (
            <path key={i} d={`M${cx-r} ${y+8+i*2} Q${cx} ${y+4+i*2} ${cx+r} ${y+8+i*2}`}
                  fill="none" stroke={mid} strokeWidth={0.6} opacity={1 - i*0.25}/>
          ))}
        </svg>
      )

    case 'l298n':
      return (
        <svg style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }} width={nodeW} height={nodeH}>
          <rect x={x} y={y} width={cw} height={ch} rx={2} fill="#1c0a00" stroke={faint} strokeWidth={0.5}/>
          <text x={cx} y={cy - 3} textAnchor="middle" fill={bright} fontSize={8} fontFamily="monospace" fontWeight="bold">L298N</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill={mid} fontSize={5} fontFamily="monospace">H-BRIDGE</text>
          {/* Arrow symbols */}
          <text x={cx-6} y={cy+18} textAnchor="middle" fill={mid} fontSize={7}>⇄</text>
        </svg>
      )

    case 'ir_array': {
      const dotCount = 8
      const dotSpacing = cw / dotCount
      return (
        <svg style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }} width={nodeW} height={nodeH}>
          {Array.from({ length: dotCount }, (_, i) => (
            <g key={i}>
              <circle cx={x + (i + 0.5) * dotSpacing} cy={cy - 4} r={3.5} fill={faint} stroke={mid} strokeWidth={0.5}/>
              <circle cx={x + (i + 0.5) * dotSpacing} cy={cy + 6} r={2.5} fill={faint} stroke={mid} strokeWidth={0.5}/>
            </g>
          ))}
          <text x={cx} y={cy + 18} textAnchor="middle" fill={mid} fontSize={5} fontFamily="monospace">TCRT5000 × 8</text>
        </svg>
      )
    }

    case 'power_module':
      return (
        <svg style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }} width={nodeW} height={nodeH}>
          <rect x={x} y={y} width={cw} height={ch} rx={2} fill="#1a0000" stroke={faint} strokeWidth={0.5}/>
          {/* Coil symbol */}
          {[0,1,2].map(i => (
            <path key={i} d={`M${cx-9+i*6} ${cy} a3 3 0 0 1 6 0`} fill="none" stroke={mid} strokeWidth={1}/>
          ))}
          {/* Capacitor */}
          <line x1={cx-6} y1={cy+8} x2={cx+6} y2={cy+8} stroke={mid} strokeWidth={1.5}/>
          <line x1={cx-6} y1={cy+11} x2={cx+6} y2={cy+11} stroke={mid} strokeWidth={1.5}/>
          <text x={cx} y={cy+21} textAnchor="middle" fill={mid} fontSize={5.5} fontFamily="monospace">LM2596</text>
        </svg>
      )

    case 'dc_motor': {
      const r = Math.min(ch / 2 - 4, 20)
      return (
        <svg style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }} width={nodeW} height={nodeH}>
          <circle cx={cx} cy={cy} r={r+4} fill={faint} stroke={mid} strokeWidth={0.5}/>
          <circle cx={cx} cy={cy} r={r} fill="#111"   stroke={mid} strokeWidth={0.5}/>
          {/* Rotor lines */}
          {[0,60,120].map(deg => {
            const rad = (deg * Math.PI) / 180
            return <line key={deg}
              x1={cx} y1={cy}
              x2={cx + (r-3) * Math.cos(rad)}
              y2={cy + (r-3) * Math.sin(rad)}
              stroke={mid} strokeWidth={1}/>
          })}
          <circle cx={cx} cy={cy} r={3} fill={mid}/>
          <text x={cx} y={cy + r + 14} textAnchor="middle" fill={mid} fontSize={5.5} fontFamily="monospace">DC 6V</text>
        </svg>
      )
    }

    default:
      return null
  }
}

// ── Main node component ─────────────────────────────────────────────────────
export default function ComponentNode({ data, selected }) {
  const comp = COMPONENT_DEFS.find(c => c.id === data.compId)
  if (!comp) return null

  const maxPins = Math.max(comp.leftPins.length, comp.rightPins.length, 1)
  const nodeH   = HEADER_H + maxPins * ROW_H + FOOTER_H
  const cat     = CATEGORIES[comp.category]
  const totalPins = comp.leftPins.length + comp.rightPins.length

  return (
    <div
      className="rounded-lg overflow-visible select-none"
      style={{
        width:  comp.nodeW,
        height: nodeH,
        background: comp.color,
        border: selected
          ? `1.5px solid ${comp.accentColor}80`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: selected
          ? `0 0 0 2px ${comp.accentColor}30, 0 4px 24px rgba(0,0,0,0.5)`
          : '0 2px 12px rgba(0,0,0,0.4)',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{
        height: HEADER_H,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        gap: 4,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f9fafb', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {comp.name}
          </div>
          <div style={{ fontSize: 8, color: comp.accentColor + '99', marginTop: 2 }}>
            {totalPins} pinos
          </div>
        </div>
        <span style={{
          fontSize: 8, fontWeight: 600,
          padding: '2px 5px', borderRadius: 4, flexShrink: 0,
          background: cat?.bg, color: cat?.color,
        }}>
          {cat?.label}
        </span>
      </div>

      {/* Chip artwork */}
      <ChipDecal
        compId={comp.id}
        nodeW={comp.nodeW}
        nodeH={nodeH}
        accentColor={comp.accentColor}
      />

      {/* Left pins */}
      {comp.leftPins.map((pin, i) => {
        const topPct = pinTopPct(i, comp.leftPins.length, maxPins, nodeH)
        const pt     = PIN_TYPES[pin.type] ?? PIN_TYPES.gpio
        return (
          <div key={pin.id}>
            <Handle
              id={pin.id}
              type="source"
              position={Position.Left}
              style={{
                top: topPct,
                width: 8, height: 8,
                background: pt.color,
                border: `1.5px solid ${pt.color}60`,
                borderRadius: '50%',
              }}
              title={`${pin.label} [${pt.label}]`}
            />
            <span style={{
              position: 'absolute',
              top: topPct,
              left: 10,
              transform: 'translateY(-50%)',
              fontSize: 7.5,
              color: '#d1d5db',
              fontFamily: '"JetBrains Mono","Fira Code",monospace',
              pointerEvents: 'none',
              userSelect: 'none',
              lineHeight: 1,
            }}>
              {pin.label}
            </span>
          </div>
        )
      })}

      {/* Right pins */}
      {comp.rightPins.map((pin, i) => {
        const topPct = pinTopPct(i, comp.rightPins.length, maxPins, nodeH)
        const pt     = PIN_TYPES[pin.type] ?? PIN_TYPES.gpio
        return (
          <div key={pin.id}>
            <Handle
              id={pin.id}
              type="source"
              position={Position.Right}
              style={{
                top: topPct,
                width: 8, height: 8,
                background: pt.color,
                border: `1.5px solid ${pt.color}60`,
                borderRadius: '50%',
              }}
              title={`${pin.label} [${pt.label}]`}
            />
            <span style={{
              position: 'absolute',
              top: topPct,
              right: 10,
              transform: 'translateY(-50%)',
              fontSize: 7.5,
              color: '#d1d5db',
              fontFamily: '"JetBrains Mono","Fira Code",monospace',
              pointerEvents: 'none',
              userSelect: 'none',
              lineHeight: 1,
              textAlign: 'right',
            }}>
              {pin.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
