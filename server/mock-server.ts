import { WebSocketServer, WebSocket } from 'ws'
import type { VehiclePosition } from '../src/types/vehicle.js'

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (ws) => {
  console.log('Client connected')
  ws.on('close', () => console.log('Client disconnected'))
})

const vehicles: VehiclePosition[] = [
  { vehicleId: 'vehicle-01', lat: 35.1815, lng: 136.9066, timestamp: '' },
  { vehicleId: 'vehicle-02', lat: 35.1700, lng: 136.9150, timestamp: '' },
  { vehicleId: 'vehicle-03', lat: 35.1950, lng: 136.8950, timestamp: '' },
]

function broadcast(data: VehiclePosition) {
  const message = JSON.stringify(data)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

function startVehicle(index: number, delay: number) {
  setTimeout(() => {
    setInterval(() => {
      const v = vehicles[index]
      v.lat += (Math.random() - 0.5) * 0.001
      v.lng += (Math.random() - 0.5) * 0.001
      v.timestamp = new Date().toISOString()
      broadcast({ ...v })
    }, 1000)
  }, delay)
}

startVehicle(0, 0)
startVehicle(1, 333)
startVehicle(2, 666)

console.log('Mock WebSocket server started on ws://localhost:8080')
