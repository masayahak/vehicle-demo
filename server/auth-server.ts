import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { auth } from "./auth.js";

const app = new Hono();

// CORS許可対象 "/api/auth/**"
// 許可のFROM AUTH_CORS_ORIGIN = Vite dev サーバー
app.use(
  "/api/auth/*",
  cors({ origin: process.env.AUTH_CORS_ORIGIN!, credentials: true }),
);

// ----------------------------------------------------------------
// WS チケット発行（ブラウザから credentials:include で呼ぶ）
// BetterAuth の HttpOnly Cookie を自動送信させてセッション検証し、
// 60秒有効なワンタイム UUID を返す
// ----------------------------------------------------------------
// ※ BetterAuth の catch-all ハンドラより前に登録すること（Hono は登録順にマッチ）
const wsTickets = new Map<string, { name: string; expiresAt: number }>();

app.post("/api/auth/ws-token", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const ticket = crypto.randomUUID();
  wsTickets.set(ticket, {
    name: session.user.name,
    expiresAt: Date.now() + 60_000,
  });

  console.log(`[WS-ticket] issued for ${session.user.name}`);
  return c.json({ ticket });
});

// ----------------------------------------------------------------
// WS チケット検証（vehicle-server からサーバー間で呼ぶ）
// ワンタイム消費：照合後は即削除
// ----------------------------------------------------------------
app.get("/api/ws-token-validate", (c) => {
  const token = c.req.query("token");
  if (!token) return c.json({ error: "Missing token" }, 400);

  const entry = wsTickets.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    wsTickets.delete(token);
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  wsTickets.delete(token);
  console.log(`[WS-ticket] validated for ${entry.name}`);
  return c.json({ name: entry.name });
});

// BetterAuth の全エンドポイントへの catch-all（上の2つより後に登録）
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

const port = Number(process.env.AUTH_SERVER_PORT) || 3000;
// Node.js の HTTP サーバーとして起動
serve({ fetch: app.fetch, port }, () => {
  console.log(`Auth server started on http://localhost:${port}`);
});
