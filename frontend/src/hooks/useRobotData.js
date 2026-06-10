import { useCallback, useEffect, useState } from 'react'
import { useWebSocket } from './useWebSocket'

const INITIAL = {
  sensors:       [0, 0, 0, 0, 0, 0, 0, 0],
  position:      0,
  leftSpeed:     0,
  rightSpeed:    0,
  pidOutput:     0,
  lineDetected:  false,
  robotConnected:false,
}

const HISTORY_LEN = 80

export function useRobotData(url) {
  const { connected, lastMessage, send, connect, disconnect } = useWebSocket(url)
  const [data,    setData]    = useState(INITIAL)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!lastMessage) return
    try {
      const msg = JSON.parse(lastMessage)

      if (msg.type === 'telemetry') {
        setData(prev => ({
          ...prev,
          sensors:      msg.sensors,
          position:     msg.position,
          leftSpeed:    msg.left_speed,
          rightSpeed:   msg.right_speed,
          pidOutput:    msg.pid_output,
          lineDetected: msg.line_detected,
        }))
        setHistory(prev => {
          const entry = {
            t:        Date.now(),
            left:     msg.left_speed,
            right:    msg.right_speed,
            position: msg.position,
          }
          const next = [...prev, entry]
          return next.length > HISTORY_LEN ? next.slice(-HISTORY_LEN) : next
        })

      } else if (msg.type === 'status') {
        setData(prev => ({ ...prev, robotConnected: msg.robot_connected }))
      }
    } catch { /* ignora mensagens malformadas */ }
  }, [lastMessage])

  const sendCommand = useCallback(
    (type, payload = {}) => send({ type, ...payload }),
    [send],
  )

  return { ...data, connected, history, sendCommand, connect, disconnect }
}
