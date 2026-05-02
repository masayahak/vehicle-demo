import { useActionState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { signIn } from "../lib/auth-client";

export default function LoginPage() {
  const navigate = useNavigate();

  // ■■■■■■■■■■■■■■■■■■■■■■■■
  // useActionState は 標準的Reactの form処理用フック
  // [state, setState, optionalIsPending]
  // state:string 実行結果 "" 正常終了 ／ エラーメッセージ文字列
  // setState: form submit時の処理
  // optionalIsPending: form submit実行中のみtrue
  // ■■■■■■■■■■■■■■■■■■■■■■■■
  const [error, formAction, isPending] = useActionState(
    // formActionの処理内容
    // _prev ステート（error）の直前の値（今回は利用しないので _ でディスカード）
    async (_prev: string, formData: FormData) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const { error } = await signIn.email(
        { email, password },
        { onSuccess: () => navigate("/") },
      );

      return error ? "メールアドレスまたはパスワードが正しくありません" : "";
    },

    // error の初期値
    "",
  );

  return (
    <div className="flex h-full items-center justify-center">
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-xl shadow-xl px-10 py-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
            <Loader2 className="size-10 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-600 text-center">
              コールドスタンバイの認証DBへ接続中です。
              起動までしばらくお待ち下さい。
            </p>
          </div>
        </div>
      )}
      <form
        action={formAction}
        className="flex flex-col gap-4 w-100 p-8 border border-gray-200 rounded-lg shadow-sm bg-white"
      >
        <h1 className="text-xl font-bold">Vehicle Demo ログイン</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email"
          name="email"
          placeholder="メールアドレス"
          required
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          name="password"
          placeholder="パスワード"
          required
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          ログイン
        </button>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>テスト用のアカウントを用意しています。</p>
          <p className="font-mono mt-1">test@example.com / kyouhayuki</p>
          <p className="font-mono mt-1">admin@test.com / admintarou</p>
        </div>
      </form>
    </div>
  );
}
