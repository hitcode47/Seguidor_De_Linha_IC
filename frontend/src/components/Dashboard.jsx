import ControlPanel from './ControlPanel'
import MotorStatus  from './MotorStatus'
import PIDTuner     from './PIDTuner'
import PositionMap  from './PositionMap'
import SensorMap    from './SensorMap'

export default function Dashboard({ robot, sensorLayout }) {
  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">

      {/* ── Navbar esquerda — Controle ─────────────────────────────── */}
      <aside className="w-full lg:w-48 shrink-0 lg:sticky lg:top-5 self-start">
        <ControlPanel robot={robot} />
      </aside>

      {/* ── Conteúdo principal ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 grid grid-cols-1 gap-5">
        <SensorMap
          sensors={robot.sensors}
          position={robot.position}
          lineDetected={robot.lineDetected}
          sensorLayout={sensorLayout?.sensors}
          boardW={sensorLayout?.boardW}
          boardH={sensorLayout?.boardH}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <PositionMap
            position={robot.position}
            leftSpeed={robot.leftSpeed}
            rightSpeed={robot.rightSpeed}
            lineDetected={robot.lineDetected}
          />

          <MotorStatus
            left={robot.leftSpeed}
            right={robot.rightSpeed}
            history={robot.history}
          />
        </div>
      </div>

      {/* ── Navbar direita — Calibração PID ───────────────────────── */}
      <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-5 self-start">
        <PIDTuner
          onUpdate={(gains) => robot.sendCommand('set_pid', gains)}
        />
      </aside>

    </div>
  )
}
