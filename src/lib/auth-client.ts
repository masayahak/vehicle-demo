import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

// -----------------------------------------------------------
// Client SDK
// 一般的なユーザー操作（トリガー）はこのSDKがカバーする
// -----------------------------------------------------------
// ログイン (signIn)
// 新規登録 (signUp)
// ログアウト (signOut)
// セッション監視 (useSession) ※ React Hook (UI連動)
// -----------------------------------------------------------
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_API_URL as string,
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut } = authClient;
