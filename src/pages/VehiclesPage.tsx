import { useVehicleWebSocket } from "../hooks/useVehicleWebSocket";
import { useAuth } from "../hooks/useAuth";
import { VehicleList } from "../components/VehicleList";
import { VehicleMap } from "../components/VehicleMap";
import { ConnectionStatusBar } from "../components/ConnectionStatusBar";

export default function VehiclesPage() {
  // fetchWsToken: 認証済みの場合のみ非null（WS チケット取得関数）
  const { fetchWsToken } = useAuth();

  // WebSocketのstatusが変わった時に再レンダリング
  // また、 nextRetryIn （残り何秒で再接続するのか？）も監視している
  const { status } = useVehicleWebSocket(fetchWsToken);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-70 shrink-0 flex-col border-r border-gray-300">
          <ConnectionStatusBar status={status} />
          <div className="overflow-y-auto flex-1">
            <VehicleList />
          </div>
        </aside>
        <main className="flex-1">
          <VehicleMap />
        </main>
      </div>
    </div>
  );
}
