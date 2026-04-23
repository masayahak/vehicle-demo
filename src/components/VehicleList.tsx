import { usePositionStore } from "../store/positionStore";
import { VEHICLE_COLORS } from "../constants/vehicles";

export function VehicleList() {
  // storeのpsitionsを取り出し
  // 取り出されるs.positionsが変わる場合のみ再レンダリング
  const positions = usePositionStore((s) => s.positions);

  // 車両番号で並べ替え
  const sorted = Array.from(positions.values()).sort((a, b) =>
    a.vehicleId.localeCompare(b.vehicleId),
  );

  return (
    <div className="p-3">
      <h2 className="text-base font-semibold mb-3">車両一覧</h2>
      {sorted.map((pos) => {
        const color = VEHICLE_COLORS[pos.vehicleId] ?? "#6B7280";
        return (
          <div
            key={pos.vehicleId}
            className="mb-3 rounded p-3 text-sm"
            style={{
              backgroundColor: color + "18",
              borderLeft: `4px solid ${color}`,
            }}
          >
            <div className="font-bold mb-1" style={{ color }}>
              {pos.vehicleId}
            </div>
            <div className="text-gray-600">緯度: {pos.lat.toFixed(6)}</div>
            <div className="text-gray-600">経度: {pos.lng.toFixed(6)}</div>
            <div className="text-gray-600">
              同期: {new Date(pos.timestamp).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
