import { useEffect, useRef, useState } from "react";
import type { VehiclePosition } from "../types/vehicle";
import { usePositionStore } from "../store/positionStore";

export type WsStatus = "connecting" | "connected" | "reconnecting" | "failed";

const WS_URL = import.meta.env.VITE_WS_URL as string;
const BASE_DELAY = 1_000;
const MAX_TOTAL_MS = Number(import.meta.env.VITE_WS_MAX_TOTAL_MS);

// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// カスタムフック（useStateを内包してラップしている）
//   - status：WebSocketの接続状態が変更された場合
//   - nextRetryIn：再接続までの残り時間が更新された場合
// --------------------------------------------------------
// 再レンダリングの要求には２種類の発火経路がある
// ① OSがWebSocketの受信を検知した時
//    受信内容をストアに格納
//    → 各コンポーネントがストアに依存し再レンダリング
// ② OSがWebSocketの切断を検知した時
//    切断を確認し useState にて 接続状態などを更新
//    → useVehicleWebSocketの戻り値に依存しているコンポーネントを再レンダリング
// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■

export function useVehicleWebSocket(): {
  status: WsStatus;
  nextRetryIn: number;
} {
  // storeの更新関数を取り出し
  const updateVehicle = usePositionStore((s) => s.setPosition);

  // このカスタムフックを呼んでいるコンポーネントを再レンダリング
  const [status, setStatus] = useState<WsStatus>("connecting");
  const [nextRetryIn, setNextRetryIn] = useState(0);

  const shouldReconnect = useRef(false); // 明示的な終了時:false 異常切断時:true
  const startedAt = useRef<number>(0);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // async connect のため WebSocket インスタンスを ref で管理
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // onopneで失敗しても、再接続させる
    shouldReconnect.current = true;
    startedAt.current = Date.now();
    retryCount.current = 0;

    function clearTimers() {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    }

    // ■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    // WebSocket 受信処理の登録と受信開始
    // --------------------------------------------------------
    // WebSocketの受信をReactが直接行うわけではない
    // 実際にWebSocketの通信を行うのはOSの仕事
    // OSへ向けて、
    //    - WebSocketの接続先 :  new WebSocket(wsUrl)
    //    - onopen 時の処理
    //    - onmessage 時の処理
    //    - onerror 時の処理
    //    - onclose 時の処理
    // を登録して、後はOSの制御に任せる。
    // OSがWebSocketの受信を感知すると、onmessageが発火する
    // ■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    function connect() {
      setStatus(retryCount.current === 0 ? "connecting" : "reconnecting");

      // 認証サーバーと同一オリジンのため Cookie が自動送信される
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      // ---------------------------------------------
      // WebSocket Open処理の登録
      // ---------------------------------------------
      ws.onopen = () => {
        retryCount.current = 0;
        setStatus("connected");
        setNextRetryIn(0);
      };

      // ---------------------------------------------
      // WebSocket メッセージの受信時処理の登録
      // ---------------------------------------------
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data as string) as VehiclePosition;
        updateVehicle(data);
      };

      ws.onerror = (error) => console.error(error);

      // ---------------------------------------------
      // WebSocket Close処理の登録
      // ---------------------------------------------
      ws.onclose = () => {
        // 正常終了時はそのまま終了
        if (!shouldReconnect.current) return;

        // -------------------------------------
        // 以下異常切断時の再接続処理
        // -------------------------------------
        const delay = Math.min(
          BASE_DELAY * 2 ** retryCount.current,
          MAX_TOTAL_MS,
        );
        const elapsed = Date.now() - startedAt.current;

        if (elapsed + delay > MAX_TOTAL_MS) {
          setStatus("failed");
          return;
        }

        retryCount.current++;
        setNextRetryIn(Math.ceil(delay / 1_000));

        // カウントダウン表示
        countdownTimer.current = setInterval(() => {
          setNextRetryIn((prev) => {
            if (prev <= 1) {
              clearInterval(countdownTimer.current!);
              return 0;
            }
            return prev - 1;
          });
        }, 1_000);

        // 再接続の実行（delay後に1回だけ）
        retryTimer.current = setTimeout(() => {
          connect();
        }, delay);
      };
    }

    connect();

    // コンポーネントアンマウント時処理
    return () => {
      shouldReconnect.current = false;
      clearTimers();
      wsRef.current?.close();
    };
  }, [updateVehicle]);

  return { status, nextRetryIn };
}
