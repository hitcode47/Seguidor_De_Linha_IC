// sensorLayout: array ordenado esq→dir vindo do editor { label, pin, x, y }
// sensors:      array de 0/1 vindo da telemetria do robô (mesma ordem)
export default function SensorBar({ sensors, position, lineDetected, sensorLayout }) {
  // Labels e contagem vêm do layout confirmado; fallback para os dados brutos
  const count  = sensorLayout ? sensorLayout.length : sensors.length
  const labels = sensorLayout
    ? sensorLayout.map(s => s.label)
    : sensors.map((_, i) => `S${i + 1}`)

  // Garante que o array de leituras tem o mesmo tamanho do layout
  const readings = Array.from({ length: count }, (_, i) => sensors[i] ?? 0)

  const pct = ((position + 1) / 2) * 100

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Sensores IR
          {sensorLayout && (
            <span className="ml-2 text-gray-600 normal-case font-normal">
              (layout do editor)
            </span>
          )}
        </h2>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          lineDetected
            ? 'bg-green-900/60 text-green-400'
            : 'bg-red-900/60 text-red-400'
        }`}>
          {lineDetected ? 'Linha detectada' : 'Sem linha'}
        </span>
      </div>

      {/* Blocos dos sensores */}
      <div className="flex justify-center gap-2 mb-5 flex-wrap">
        {readings.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className={`w-10 h-14 rounded-lg transition-all duration-75 border flex items-end justify-center pb-1 ${
              val
                ? 'bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-400/30'
                : 'bg-gray-800 border-gray-700'
            }`}>
              {/* Dois pontinhos IR no fundo do sensor */}
              <span className="flex gap-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-yellow-800' : 'bg-red-900'}`}/>
                <span className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-yellow-800' : 'bg-green-900'}`}/>
              </span>
            </div>
            <span className="text-xs text-gray-500 font-mono truncate max-w-[2.5rem] text-center"
                  title={labels[i]}>
              {labels[i]}
            </span>
          </div>
        ))}
      </div>

      {/* Barra de posição */}
      <div className="relative h-2 bg-gray-800 rounded-full overflow-visible">
        <div
          className="absolute w-4 h-4 bg-yellow-400 rounded-full shadow shadow-yellow-400/50
                     top-1/2 -translate-y-1/2 transition-all duration-75"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-gray-600 select-none">
        <span>← {labels[0]}</span>
        <span>Centro</span>
        <span>{labels[count - 1]} →</span>
      </div>
    </div>
  )
}
