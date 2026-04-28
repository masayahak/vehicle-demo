import { authClient } from "../lib/auth-client";

// セッション情報を取得する
export function useAuth() {
  const { data: session, isPending } = authClient.useSession();

  return {
    user: session?.user ?? null,
    isPending,
    signOut: () => authClient.signOut(),
  };
}
