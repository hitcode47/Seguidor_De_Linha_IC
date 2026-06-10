import { useCallback, useEffect, useRef, useState } from 'react'

const RECONNECT_MS = 2000

export function useWebSocket(url) {
  const [connected,   setConnected]   = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const ws         = useRef(null)
  const timer      = useRef(null)
  const urlRef     = useRef(url)
  const manualRef  = useRef(false)   // true = desconexão intencional, não reconectar

  const connect = useCallback(() => {
    manualRef.current = false
    if (ws.current?.readyState === WebSocket.OPEN) return

    try {
      ws.current = new WebSocket(urlRef.current)

      ws.current.onopen = () => {
        setConnected(true)
        clearTimeout(timer.current)
      }

      ws.current.onclose = () => {
        setConnected(false)
        if (!manualRef.current) {
          timer.current = setTimeout(connect, RECONNECT_MS)
        }
      }

      ws.current.onerror = () => ws.current?.close()

      ws.current.onmessage = (e) => setLastMessage(e.data)
    } catch {
      if (!manualRef.current) {
        timer.current = setTimeout(connect, RECONNECT_MS)
      }
    }
  }, [])

  const disconnect = useCallback(() => {
    manualRef.current = true
    clearTimeout(timer.current)
    ws.current?.close()
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(timer.current)
      ws.current?.close()
    }
  }, [connect])

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }, [])

  return { connected, lastMessage, send, connect, disconnect }
}
