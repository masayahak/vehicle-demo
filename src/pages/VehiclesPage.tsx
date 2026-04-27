import { useVehicleWebSocket } from "../hooks/useVehicleWebSocket";
import { VehicleList } from "../components/VehicleList";
import { VehicleMap } from "../components/VehicleMap";
import { ConnectionStatusBar } from "../components/ConnectionStatusBar";

export default function VehiclesPage() {
  // WebSocketのstatusが変わった時に再レンダリング
  // また、 nextRetryIn （残り何秒で再接続するのか？）も監視している
  const { status, nextRetryIn } = useVehicleWebSocket();

  return (
    <div className="flex h-full flex-col">
      <ConnectionStatusBar status={status} nextRetryIn={nextRetryIn} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-70 shrink-0 overflow-y-auto border-r border-gray-300">
          <VehicleList />
        </aside>
        <main className="flex-1">
          <VehicleMap />
        </main>
      </div>
    </div>
  );
}
