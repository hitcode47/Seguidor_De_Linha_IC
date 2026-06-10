import { getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react'

const PROTO_COLOR = {
  power_5v:  '#ef4444',
  power_3v3: '#f97316',
  ground:    '#9ca3af',
  gpio:      '#60a5fa',
  adc:       '#34d399',
  pwm:       '#c084fc',
  i2c:       '#22d3ee',
  spi:       '#fbbf24',
  uart:      '#f472b6',
  motor_out: '#a3e635',
  enable:    '#fde047',
  default:   '#6b7280',
}

export default function SignalEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, selected,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const color  = PROTO_COLOR[data?.protocol] ?? PROTO_COLOR.default
  const label  = data?.signal ?? ''
  const dashed = data?.protocol === 'ground' ? '5,3' : undefined

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke:          color,
          strokeWidth:     selected ? 2 : 1.5,
          strokeDasharray: dashed,
          filter:          selected ? `drop-shadow(0 0 4px ${color}90)` : undefined,
          opacity:         selected ? 1 : 0.75,
          transition:      'opacity 0.15s',
        }}
      />

      {label && (
        <EdgeLabelRenderer>
          <div style={{
            position:  'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize:  8,
            fontFamily: '"JetBrains Mono","Fira Code",monospace',
            background: '#0d1117',
            color:      color,
            padding:    '1px 5px',
            borderRadius: 3,
            border:     `1px solid ${color}40`,
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
