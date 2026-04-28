import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";

// ■■■■■■■■■■■■■■■■■■■■■■■■
// Better-Auth 基本設定
// ■■■■■■■■■■■■■■■■■■■■■■■■
export const auth = betterAuth({
  // 1) レート制限 — ブルートフォース攻撃対策
  // 本番環境では storage: "database" または customStorage で Redis を推奨
  rateLimit: {
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 }, // 60秒間に5回まで
    },
  },
  // 2) 認証情報は `drizzle` 経由の `Postgres` へ格納する
  database: drizzleAdapter(db, { provider: "pg", schema }),

  // 3) 認証はemail + パスワードのみとする
  emailAndPassword: { enabled: true },

  // 4) セッションの有効期限を設定する
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7日間
    updateAge: 60 * 60 * 24, // 1日ごとに有効期限を更新
  },

  // 5) プラグインを設定する
  plugins: [admin()],

  trustedOrigins: [process.env.AUTH_CORS_ORIGIN!],
});
