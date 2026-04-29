import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "http";
import { auth } from "./auth.js";
import type { VehiclePosition } from "../src/types/vehicle.js";

// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// 統合サーバー（認証 + 車両位置 WebSocket）
// ------------------------------------------------------------------
// ★注意★
// 認証サーバーと車両位置サーバーを分離すると、車両位置サーバーにて
// 接続してきたクライアントが認証済みか否か、判定が難しくなる。
// クライアントはWS接続時にセッション情報を渡せるが、
// BetterAuthはDBへハッシュ化されたセッション情報を格納しているので
// 単純に有効なセッションなのか判定することができない。
// そのため、認証サーバーでチケットを発行→WSサーバーはチケットの
// 確認を認証サーバーへ要求する仕組みが必要になる。
// また、接続時以外にも定期的にクライアントの認証状況を確認する仕組みも
// 必要になる。
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

// 定期再認証の設定
const RENEW_INTERVAL_MS = 30_000; // 30秒ごとにセッションを再検証

// -------------------------------------------------------
// HTTPリクエストヘッダーを
// Node.jsが受信時に取得したNode.js用のヘッダー形式から、
// ブラウザ標準のヘッダー形式へ変換する。
// ※ auth.api.getSession() がブラウザ標準形式しか受け付けないため。
// -------------------------------------------------------
function toHeaders(req: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }
  return headers;
}

// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// Hono アプリ（認証エンドポイント）
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

const app = new Hono();

// CORS許可対象 "/api/auth/*"
// 許可のFROM AUTH_CORS_ORIGIN = Vite dev サーバー
app.use(
  "/api/auth/*",
  cors({ origin: process.env.AUTH_CORS_ORIGIN!, credentials: true }),
);

// BetterAuth の全エンドポイントへの catch-all
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// HTTP サーバー起動
const port = Number(process.env.AUTH_SERVER_PORT) || 3000;
const httpServer = serve({ fetch: app.fetch, port }, () => {
  console.log(`Server started on http://localhost:${port}`);
}) as Server;

// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// 車両位置 WebSocket サーバー
// （BetterAuth + WS を同一ポートで提供）
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// wss：サーバー全体 ws：個々のクライアントとの通信
const wss = new WebSocketServer({ server: httpServer });

// --------------------------------------------------------------
// ① 新しいクライアントからの WS 接続確立時に実行
// Cookie を直接検証するためチケット発行不要
// --------------------------------------------------------------
wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
  // ============================================================
  // 以下、接続を要求してきたクライアントごとにパラレル
  // ============================================================
  const wsHeaders = toHeaders(req);

  // 接続時のセッション検証
  const initialSession = await auth.api.getSession({ headers: wsHeaders });
  if (!initialSession) {
    ws.close(4001, "Unauthorized");
    return;
  }
  console.log(`Client connected: ${initialSession.user.name}`);

  // 定期再認証
  const renewInterval = setInterval(async () => {
    if (ws.readyState !== WebSocket.OPEN) return;

    const session = await auth.api.getSession({ headers: wsHeaders });
    if (!session) {
      console.log(`[WS] session expired: ${initialSession.user.name}`);
      ws.close(4401, "Session expired");
    }
  }, RENEW_INTERVAL_MS);

  // 切断時（クライアント要求・セッション切れ問わず）
  ws.on("close", () => {
    clearInterval(renewInterval);
    console.log(`Client disconnected: ${initialSession.user.name}`);
  });
});

// --------------------------------------------------------------
// ② WS 車両位置配信
// --------------------------------------------------------------

// 車両の初期位置
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

// --------------------------------------------------------------
// ③ WS 車両位置サーバー起動時に、配信を開始
// --------------------------------------------------------------
startVehicle(0, 0);
startVehicle(1, 333);
startVehicle(2, 666);

console.log(`Vehicle WebSocket server started on ws://localhost:${port}`);
