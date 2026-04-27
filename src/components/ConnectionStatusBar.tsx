import type { WsStatus } from "../hooks/useVehicleWebSocket";

type Props = {
  status: WsStatus;
  nextRetryIn: number;
};

export function ConnectionStatusBar({ status, nextRetryIn }: Props) {
  if (status === "connected") return null;

  const config = {
    connecting: {
      bg: "bg-yellow-100 border-yellow-400 text-yellow-800",
      message: "サーバーに接続中...",
    },
    reconnecting: {
      bg: "bg-yellow-100 border-yellow-400 text-yellow-800",
      message: `サーバーと切断されました。再接続中... (${nextRetryIn}秒後)`,
    },
    failed: {
      bg: "bg-red-100 border-red-400 text-red-800",
      message: "接続できません。ページを再読み込みしてください。",
    },
  } satisfies Record<Exclude<WsStatus, "connected">, { bg: string; message: string }>;

  const { bg, message } = config[status];

  return (
    <div className={`border-b px-4 py-2 text-sm font-medium ${bg}`}>
      {message}
    </div>
  );
}
