import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 bg-gray-50">
      <div className="text-center">
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
          React 学習用デモ
        </p>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          リアルタイム車両位置表示
        </h1>
        <p className="text-gray-500 text-base">
          Zustand / WebSocket / Leaflet / React Router を使った SPA デモ
        </p>
      </div>

      {/* ------------------------------------------------------------
        NavLinkを使わずに buttonを使う理由
        NavLinkは isActiveを判定するが、ここでは一方通行の画面遷移を要求してるだけなので
        ボタンで実装が自然
        --------------------------------------------------------------
        テキストリンク（青字下線）→ 文章中の補足・参照
        ボタン                    → アクション（送信・移動・実行）
        カード・画像              → コンテンツへの導線
      ---------------------------------------------------------------- */}
      {/* transition-colors： hover 時の色変更をアニメーション */}
      <button
        onClick={() => navigate("/vehicles")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        車両表示を見る
      </button>
    </div>
  );
}
