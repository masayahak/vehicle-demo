const techStack = [
  { name: "React 19", desc: "UI コンポーネントライブラリ" },
  { name: "TypeScript 6", desc: "型安全な JavaScript" },
  { name: "Zustand 5", desc: "シンプルなグローバル状態管理" },
  { name: "WebSocket", desc: "サーバーからのリアルタイム位置情報受信" },
  { name: "Leaflet / react-leaflet 5", desc: "インタラクティブな地図表示" },
  { name: "React Router 7", desc: "クライアントサイドルーティング" },
  { name: "Tailwind CSS 4", desc: "ユーティリティファーストな CSS" },
  { name: "Vite 8", desc: "高速なビルドツール" },
];

export default function AboutPage() {
  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">About</h1>
      <p className="text-gray-500 text-sm mb-8">
        このアプリは React / TypeScript のネイティブな使い方を学ぶための学習用デモです。
        モックサーバーが WebSocket で車両位置を送信し、地図上にリアルタイム表示します。
      </p>
      <h2 className="text-base font-semibold text-gray-700 mb-3">技術スタック</h2>
      <ul>
        {techStack.map(({ name, desc }, i) => (
          <li
            key={name}
            className={`flex items-start gap-3 text-sm px-2 py-2 rounded ${i % 2 === 0 ? "bg-gray-200" : ""}`}
          >
            <span className="font-medium text-gray-800 w-48 shrink-0">{name}</span>
            <span className="text-gray-500">{desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
