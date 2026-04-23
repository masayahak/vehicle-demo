import { useEffect } from "react";
import type { VehiclePosition } from "../types/vehicle";
import { usePositionStore } from "../store/positionStore";

export function useVehicleWebSocket(): void {
  // storeの更新関数を取り出し
  const updateVehicle = usePositionStore((s) => s.setPosition);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => console.log("WebSocket connected");

    // wsを受信し、車両位置を書き換えstoreする
    ws.onmessage = (event) => {
      const pos = JSON.parse(event.data as string) as VehiclePosition;
      // storeの更新関数を実行s
      updateVehicle(pos);
    };
    ws.onclose = () => console.log("WebSocket closed");
    ws.onerror = (error) => console.error(error);

    return () => ws.close();
  }, [updateVehicle]);
}
