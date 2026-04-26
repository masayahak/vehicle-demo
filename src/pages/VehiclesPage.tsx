import { useVehicleWebSocket } from "../hooks/useVehicleWebSocket";
import { VehicleList } from "../components/VehicleList";
import { VehicleMap } from "../components/VehicleMap";

export default function VehiclesPage() {
  useVehicleWebSocket();

  return (
    <div className="flex h-full">
      <aside className="w-70 shrink-0 overflow-y-auto border-r border-gray-300">
        <VehicleList />
      </aside>
      <main className="flex-1">
        <VehicleMap />
      </main>
    </div>
  );
}
