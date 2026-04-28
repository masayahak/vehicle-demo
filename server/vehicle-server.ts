import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import type { VehiclePosition } from "../src/types/vehicle.js";

const AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

// 定期再認証の設定（§13-15）
const RENEW_INTERVAL_MS = 30_000; // 30秒ごとにクライアントへ再認証要求
const RENEW_TIMEOUT_MS = 5_000;   // 5秒以内に応答が無ければ切断

// auth-server のチケット検証エンドポイントへ問い合わせ（ワンタイム消費）
async function validateTicket(token: string): Promise<{ name: string } | null> {
  try {
    const res = await fetch(
      `${AUTH_URL}/api/ws-token-validate?token=${encodeURIComponent(token)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as { name: string } | null;
  } catch (err) {
    console.error("[WS] validate error:", err);
    return null;
  }
}

// サーバー全体（複数接続を束ねる）
const wss = new WebSocketServer({ port: 8080 });

// --------------------------------------------------------------
// 新しいクライアントからのws接続確立で実行
// token をクエリパラメーターで受け取り、auth-server で検証する
// --------------------------------------------------------------
// wsが送信する車両情報は機密情報とする
// 接続時の検証に加え、§13-15 の定期再認証で接続後の生存も担保する
// --------------------------------------------------------------
wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
  const url = new URL(req.url!, "ws://localhost:8080");
  const token = url.searchParams.get("token");

  if (!token) {
    ws.close(4001, "Unauthorized");
    return;
  }

  console.log(`[WS] Connected token=${token.slice(0, 10)}...`);

  const initial = await validateTicket(token);
  if (!initial) {
    ws.close(4001, "Unauthorized");
    return;
  }
  console.log(`Client connected: ${initial.name}`);

  // -----------------------------------------------------------
  // 定期再認証（§13-15）
  // -----------------------------------------------------------
  // - RENEW_INTERVAL_MS ごとに {type:"auth-renew"} を送信
  // - 送信後 RENEW_TIMEOUT_MS 以内に {type:"auth", ticket} が
  //   返らなければ close(4401)
  // - チケット検証も auth-server へ問い合わせる（同じワンタイム経路）
  // -----------------------------------------------------------
  let renewTimeout: ReturnType<typeof setTimeout> | null = null;

  const renewInterval = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({ type: "auth-renew" }));

    renewTimeout = setTimeout(() => {
      console.log(`[WS] auth renew timeout: ${initial.name}`);
      ws.close(4401, "Auth renew timeout");
    }, RENEW_TIMEOUT_MS);
  }, RENEW_INTERVAL_MS);

  ws.on("message", async (raw) => {
    let msg: { type?: string; ticket?: string };
    try {
      msg = JSON.parse(raw.toString()) as { type?: string; ticket?: string };
    } catch {
      return; // 不正 JSON は無視
    }

    if (msg.type !== "auth") return;

    if (!msg.ticket) {
      ws.close(4401, "Auth renew failed");
      return;
    }

    const renewed = await validateTicket(msg.ticket);
    if (!renewed) {
      console.log(`[WS] auth renew rejected: ${initial.name}`);
      ws.close(4401, "Auth renew failed");
      return;
    }

    // タイムアウト解除（次の auth-renew まで生存延長）
    if (renewTimeout) {
      clearTimeout(renewTimeout);
      renewTimeout = null;
    }
    console.log(`[WS] auth renewed: ${renewed.name}`);
  });

  ws.on("close", () => {
    clearInterval(renewInterval);
    if (renewTimeout) clearTimeout(renewTimeout);
    console.log(`Client disconnected: ${initial.name}`);
  });
});

// VehiclePosition型: サーバー・クライアント共有
const vehicles: VehiclePosition[] = [
  { vehicleId: "vehicle-01", lat: 35.1815, lng: 136.9066, timestamp: "" },
  { vehicleId: "vehicle-02", lat: 35.17, lng: 136.915, timestamp: "" },
  { vehicleId: "vehicle-03", lat: 35.195, lng: 136.895, timestamp: "" },
];

// --------------------------------------------------------------
// 全接続クライアントへブロードキャスト（各車両毎）
// --------------------------------------------------------------
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
  setTimeout(() => {
    setInterval(() => {
      const v = vehicles[index];
      v.lat += (Math.random() - 0.5) * 0.001;
      v.lng += (Math.random() - 0.5) * 0.001;
      v.timestamp = new Date().toISOString(); // UTC時刻
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

console.log("Vehicle WebSocket server started on ws://localhost:8080");
