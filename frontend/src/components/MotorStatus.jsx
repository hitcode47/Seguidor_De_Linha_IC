import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

function SpeedGauge({ label, speed }) {
  const abs = Math.abs(speed)
  const pct = (abs / 255) * 100
  const circumference = 2 * Math.PI * 40   // r=40
  const stroke = (pct / 100) * circumference
  const color  = speed >= 0 ? '#4ade80' : '#f87171'
  const dir    = speed > 0 ? 'frente' : speed < 0 ? 'ré' : 'parado'

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${stroke} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 80ms linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none">{abs}</span>
          <span className="text-xs text-gray-500">{dir}</span>
        </div>
      </div>
    </div>
  )
}

export default function MotorStatus({ left, right, history }) {
  const chartData = history.map(({ t, left: l, right: r }) => ({
    t,
    Esquerdo: l,
    Direito:  r,
  }))

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex flex-col gap-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Motores</h2>

      <div className="flex justify-around">
        <SpeedGauge label="Esquerdo" speed={left}  />
        <SpeedGauge label="Direito"  speed={right} />
      </div>

      {history.length > 1 && (
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="t" hide />
              <YAxis domain={[-255, 255]} hide />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', fontSize: 11 }}
                formatter={(v) => [v, '']}
                labelFormatter={() => ''}
              />
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Esquerdo" stroke="#4ade80" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              <Line type="monotone" dataKey="Direito"  stroke="#60a5fa" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
