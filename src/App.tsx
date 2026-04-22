import { useVehicleWebSocket } from './hooks/useVehicleWebSocket'
import { VehicleList } from './components/VehicleList'
import { VehicleMap } from './components/VehicleMap'

function App() {
  useVehicleWebSocket()

  return (
    <div className="flex flex-col h-screen">
      <header className="px-4 py-2 border-b border-gray-300 bg-gray-100">
        <h1 className="text-lg font-medium">リアルタイム車両位置表示</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-70 shrink-0 overflow-y-auto border-r border-gray-300">
          <VehicleList />
        </aside>
        <main className="flex-1">
          <VehicleMap />
        </main>
      </div>
    </div>
  )
}

export default App
