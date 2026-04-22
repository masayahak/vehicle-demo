import { WebSocketServer, WebSocket } from "ws";
import type { VehiclePosition } from "../src/types/vehicle.js";

// サーバー全体（複数接続を束ねる）
const wss = new WebSocketServer({ port: 8080 });

// 新しいクライアントからのws接続確立で実行
wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("close", () => console.log("Client disconnected"));
});

// VehiclePosition型: サーバー・クライアント共有
const vehicles: VehiclePosition[] = [
  { vehicleId: "vehicle-01", lat: 35.1815, lng: 136.9066, timestamp: "" },
  { vehicleId: "vehicle-02", lat: 35.17, lng: 136.915, timestamp: "" },
  { vehicleId: "vehicle-03", lat: 35.195, lng: 136.895, timestamp: "" },
];

// 全接続クライアントへブロードキャスト（各車両毎）
function broadcast(data: VehiclePosition) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 車両ごとに送信開始タイミングをずらして独立したループを起動
function startVehicle(index: number, delay: number) {
  // 初回の起動タイミングだけ、delayでずらす
  setTimeout(() => {
    // 1000msごとに再実行
    setInterval(() => {
      // 定義済みのvehiclesを取り出し
      const v = vehicles[index];

      // vの参照アドレスは変更しない。前回の値を引き継ぐ
      v.lat += (Math.random() - 0.5) * 0.001;
      v.lng += (Math.random() - 0.5) * 0.001;
      v.timestamp = new Date().toISOString(); // UTC時刻

      // wss配信(車両1両ずつ)
      broadcast({ ...v });
    }, 1000);
  }, delay);
}

// -----------------------------------------------
// 起動時に実行
// -----------------------------------------------
startVehicle(0, 0);
startVehicle(1, 333);
startVehicle(2, 666);

console.log("Mock WebSocket server started on ws://localhost:8080");
