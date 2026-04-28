import type { WsStatus } from "../hooks/useVehicleWebSocket";

type Props = {
  status: WsStatus;
};

// ガタつき防止のため常時表示・固定高さ。
// failed になるまでは緑（接続中）で統一する。
// connecting / reconnecting 中も緑のままにするのは意図的な設計（§9-6 参照）。
const NORMAL = {
  bg: "bg-green-50 border-green-200 text-green-700",
  dot: "bg-green-500",
  message: "接続中",
};
const FAILED = {
  bg: "bg-red-100 border-red-400 text-red-800",
  dot: "bg-red-500",
  message: "接続できません。ページを再読み込みしてください。",
};

export function ConnectionStatusBar({ status }: Props) {
  const { bg, dot, message } = status === "failed" ? FAILED : NORMAL;

  return (
    <div className={`flex items-center gap-2 border-b px-4 py-2 text-sm font-medium ${bg}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      {message}
    </div>
  );
}
