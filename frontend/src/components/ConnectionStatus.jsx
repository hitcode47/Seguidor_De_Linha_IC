function Dot({ active }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-400' : 'bg-red-500'}`}/>
  )
}

export default function ConnectionStatus({ connected, robotConnected, onConnect, onDisconnect }) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-400">
      <span className="flex items-center gap-2">
        <Dot active={connected} /> Servidor
      </span>
      <span className="flex items-center gap-2">
        <Dot active={robotConnected} /> Robô
      </span>
      <button
        onClick={connected ? onDisconnect : onConnect}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          connected
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            : 'bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white'
        }`}
      >
        {connected ? 'Desconectar' : 'Conectar'}
      </button>
    </div>
  )
}
