import { useState } from 'react'

function GainSlider({ label, symbol, value, min, max, step, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">
          {label}{' '}
          <span className="text-gray-600 font-mono text-xs">({symbol})</span>
        </span>
        <span className="font-mono text-yellow-400 tabular-nums">
          {value.toFixed(3)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-yellow-400 h-1 rounded bg-gray-700"
      />
      <div className="flex justify-between text-xs text-gray-700">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export default function PIDTuner({ onUpdate }) {
  const [gains, setGains] = useState({ kp: 1.5, ki: 0.0, kd: 0.8 })

  function update(key, val) {
    const next = { ...gains, [key]: val }
    setGains(next)
    onUpdate(next)
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Controlador PID
      </h2>
      <div className="grid grid-cols-1 gap-5">
        <GainSlider
          label="Proporcional" symbol="Kp"
          value={gains.kp} min={0} max={5} step={0.05}
          onChange={(v) => update('kp', v)}
        />
        <GainSlider
          label="Integral" symbol="Ki"
          value={gains.ki} min={0} max={2} step={0.01}
          onChange={(v) => update('ki', v)}
        />
        <GainSlider
          label="Derivativo" symbol="Kd"
          value={gains.kd} min={0} max={5} step={0.05}
          onChange={(v) => update('kd', v)}
        />
      </div>
    </div>
  )
}
