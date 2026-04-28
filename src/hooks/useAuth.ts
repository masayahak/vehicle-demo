import { authClient } from "../lib/auth-client";

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL as string;

// セッション情報を取得する
export function useAuth() {
  const { data: session, isPending } = authClient.useSession();

  // -------------------------------------------------------
  // WS チケット取得
  // ブラウザが HttpOnly Cookie を自動送信し、auth-server が
  // 60秒有効なワンタイム UUID を発行する
  // -------------------------------------------------------
  const fetchWsToken = async (): Promise<string | null> => {
    try {
      const res = await fetch(`${AUTH_API_URL}/api/auth/ws-token`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { ticket: string };
      return data.ticket;
    } catch {
      return null;
    }
  };

  return {
    user: session?.user ?? null,
    isPending,
    signOut: () => authClient.signOut(),
    // 認証済みの場合のみ fetchWsToken を渡す（null なら WS 接続しない）
    fetchWsToken: session ? fetchWsToken : null,
  };
}
