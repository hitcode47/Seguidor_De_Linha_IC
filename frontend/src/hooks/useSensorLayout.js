import { useState, useCallback } from 'react'

const uid = () => `s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`

const makeSensor = (index, x, y) => ({
  id:         uid(),
  label:      `S${index + 1}`,
  pin:        index + 1,
  x,
  y,
  activeHigh: true,
})

const DEFAULT_W = 150   // mm
const DEFAULT_H = 60    // mm

// 8 sensores espaçados 16mm, centralizados no centro geométrico da placa (75, 30)
const DEFAULTS = Array.from({ length: 8 }, (_, i) =>
  makeSensor(i, 19 + i * 16, 30),
)

export function useSensorLayout() {
  const [sensors, setSensors] = useState(DEFAULTS)
  const [boardW,  setBoardW]  = useState(DEFAULT_W)
  const [boardH,  setBoardH]  = useState(DEFAULT_H)

  const addSensor = useCallback(() => {
    setSensors(prev => {
      const n = prev.length
      return [...prev, makeSensor(n, 10, 10)]
    })
  }, [])

  const removeSensor = useCallback((id) =>
    setSensors(prev => prev.filter(s => s.id !== id))
  , [])

  const moveSensor = useCallback((id, x, y) =>
    setSensors(prev => prev.map(s => s.id === id ? { ...s, x, y } : s))
  , [])

  const updateSensor = useCallback((id, patch) =>
    setSensors(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  , [])

  const clearAll = useCallback(() => setSensors([]), [])

  // Redimensiona a área — sensores fora dos novos limites são clampados
  const resizeBoard = useCallback((w, h) => {
    const nw = Math.max(50, Math.min(800, w))
    const nh = Math.max(30, Math.min(400, h))
    setBoardW(nw)
    setBoardH(nh)
    setSensors(prev => prev.map(s => ({
      ...s,
      x: Math.min(s.x, nw),
      y: Math.min(s.y, nh),
    })))
  }, [])

  const getOrdered = useCallback(() =>
    [...sensors].sort((a, b) => a.x - b.x)
  , [sensors])

  const exportConfig = useCallback(() => {
    const ordered = getOrdered()
    const pins    = ordered.map(s => s.pin).join(', ')
    const count   = ordered.length
    return (
      `#define SENSOR_COUNT ${count}\n` +
      `inline constexpr uint8_t SENSOR_PINS[SENSOR_COUNT] = { ${pins} };`
    )
  }, [getOrdered])

  return {
    sensors,
    boardW, boardH,
    addSensor,
    removeSensor,
    moveSensor,
    updateSensor,
    clearAll,
    resizeBoard,
    getOrdered,
    exportConfig,
  }
}
