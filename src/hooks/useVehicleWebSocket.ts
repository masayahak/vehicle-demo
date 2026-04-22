import { useEffect } from 'react'
import type { VehiclePosition } from '../types/vehicle'
import { usePositionStore } from '../store/positionStore'

export function useVehicleWebSocket(): void {
  const setPosition = usePositionStore((s) => s.setPosition)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')

    ws.onopen = () => console.log('WebSocket connected')
    ws.onmessage = (event) => {
      const pos = JSON.parse(event.data as string) as VehiclePosition
      setPosition(pos)
    }
    ws.onclose = () => console.log('WebSocket closed')
    ws.onerror = (error) => console.error(error)

    return () => ws.close()
  }, [setPosition])
}
