import { useState }          from 'react'
import { useRobotData }      from './hooks/useRobotData'
import { useSensorLayout }   from './hooks/useSensorLayout'
import Dashboard             from './components/Dashboard'
import ConnectionStatus      from './components/ConnectionStatus'
import FirmwareEditor        from './components/FirmwareEditor'
import Observability         from './components/Observability'
import SensorEditor          from './components/SensorEditor'
import BoardAssembly         from './components/BoardAssembly'
import ControlProject        from './components/ControlProject'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws'

const TABS = [
  { id: 'dashboard',   label: 'Dashboard'           },
  { id: 'editor',      label: 'Editor de Sensores'  },
  { id: 'montagem',    label: 'Placas / Montagem'   },
  { id: 'observ',      label: 'Observabilidade'     },
  { id: 'controle',    label: 'Projeto de Controle' },
  { id: 'firmware',    label: 'Firmware / ESP32'    },
  { id: 'metricas',    label: 'Métricas'            },
]

export default function App() {
  const robot  = useRobotData(WS_URL)
  const layout = useSensorLayout()   // estado vivo do editor

  // Snapshot confirmado — só muda ao clicar "Atualizar Dashboard"
  const [dashboardLayout, setDashboardLayout] = useState(
    () => ({ sensors: layout.getOrdered(), boardW: layout.boardW, boardH: layout.boardH })
  )
  const [tab, setTab] = useState('dashboard')

  function applyToDashboard() {
    setDashboardLayout({
      sensors: layout.getOrdered(),
      boardW:  layout.boardW,
      boardH:  layout.boardH,
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Robô Seguidor de Linha — Projeto IC</h1>
          <p className="text-xs text-gray-600 mt-0.5">Painel de controle em tempo real</p>
        </div>
        <ConnectionStatus
          connected={robot.connected}
          robotConnected={robot.robotConnected}
          onConnect={robot.connect}
          onDisconnect={robot.disconnect}
        />
      </header>

      <nav className="border-b border-gray-800 px-6 flex">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className={['montagem','firmware','controle'].includes(tab) ? '' : 'p-5 max-w-6xl mx-auto'}>
        {tab === 'dashboard' && (
          <Dashboard robot={robot} sensorLayout={dashboardLayout} />
        )}
        {tab === 'editor' && (
          <SensorEditor layout={layout} onApply={applyToDashboard} />
        )}
        {tab === 'montagem' && (
          <BoardAssembly />
        )}
        {tab === 'observ' && (
          <Observability robot={robot} />
        )}
        {tab === 'firmware' && (
          <FirmwareEditor />
        )}
        {tab === 'metricas' && (
          <div className="flex items-center justify-center min-h-[40vh]">
            <p className="text-xs text-gray-700 font-mono tracking-widest uppercase">
              Métricas — em breve
            </p>
          </div>
        )}
        {tab === 'controle' && (
          <ControlProject />
        )}
      </main>
    </div>
  )
}
