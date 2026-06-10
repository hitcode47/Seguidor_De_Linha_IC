import { useState } from 'react'

export default function ControlPanel({ robot }) {
  const { sendCommand, lineDetected, pidOutput } = robot
  const [baseSpeed, setBaseSpeed] = useState(150)

  function applySpeed(val) {
    setBaseSpeed(val)
    sendCommand('set_speed', { base_speed: val })
  }

  return (
    <nav className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
        Controle
      </h2>

      {/* Ações */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => sendCommand('start')}
          className="w-full px-3 py-2.5 bg-green-700 hover:bg-green-600 active:bg-green-800
                     rounded-lg text-sm font-semibold text-left transition-colors"
        >
          Iniciar
        </button>
        <button
          onClick={() => sendCommand('stop')}
          className="w-full px-3 py-2.5 bg-red-700 hover:bg-red-600 active:bg-red-800
                     rounded-lg text-sm font-semibold text-left transition-colors"
        >
          Parar
        </button>
        <button
          onClick={() => sendCommand('calibrate')}
          className="w-full px-3 py-2.5 bg-blue-700 hover:bg-blue-600 active:bg-blue-800
                     rounded-lg text-sm font-semibold text-left transition-colors"
        >
          Calibrar
        </button>
      </div>

      <div className="border-t border-gray-800" />

      {/* Velocidade base */}
      <div className="flex flex-col gap-2 px-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Velocidade base</span>
          <span className="font-mono text-yellow-400 tabular-nums">{baseSpeed}</span>
        </div>
        <input
          type="range" min={50} max={255} step={5} value={baseSpeed}
          onChange={(e) => applySpeed(parseInt(e.target.value))}
          className="w-full accent-yellow-400 h-1 bg-gray-700 rounded"
        />
        <div className="flex justify-between text-xs text-gray-700">
          <span>50</span><span>255</span>
        </div>
      </div>

      <div className="border-t border-gray-800" />

      {/* Stats */}
      <div className="flex flex-col gap-3 px-1">
        <div>
          <div className="text-xs text-gray-500 mb-0.5">Saída PID</div>
          <div className="font-mono font-bold text-sm text-white tabular-nums">
            {(pidOutput ?? 0).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-0.5">Linha</div>
          <div className={`font-mono font-bold text-sm ${lineDetected ? 'text-green-400' : 'text-red-400'}`}>
            {lineDetected ? 'Detectada' : 'Perdida'}
          </div>
        </div>
      </div>
    </nav>
  )
}
