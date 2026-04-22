# リアルタイム車両位置表示アプリ 詳細仕様書

**作成日**: 2026-04-23  
**目的**: Zustand / WebSocket / Leaflet の実践学習

---

## 1. 技術スタック

| 役割                      | 技術                         | バージョン                        |
| ------------------------- | ---------------------------- | --------------------------------- |
| フロントエンド            | React SPA                    | 18.x                              |
| ビルドツール              | Vite                         | 5.x                               |
| 言語                      | TypeScript                   | 5.x                               |
| 状態管理                  | Zustand                      | 4.x                               |
| 地図                      | Leaflet + react-leaflet      | leaflet 1.9.x / react-leaflet 4.x |
| WebSocket（クライアント） | ブラウザ標準 `WebSocket` API | -                                 |
| WebSocket（サーバー）     | ws ライブラリ                | 8.x                               |
| サーバー実行              | tsx                          | 4.x                               |

---

## 2. ディレクトリ構成

```
vehicle-demo/
├── server/
│   └── mock-server.ts           # モックWebSocketサーバー
├── src/
│   ├── store/
│   │   └── positionStore.ts     # Zustand store
│   ├── hooks/
│   │   └── useVehicleWebSocket.ts
│   ├── components/
│   │   ├── VehicleMap.tsx       # Leaflet地図
│   │   └── VehicleList.tsx      # 車両一覧パネル
│   ├── types/
│   │   └── vehicle.ts           # 共通型定義
│   └── App.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. 型定義（`src/types/vehicle.ts`）

```ts
export type VehiclePosition = {
  vehicleId: string; // "vehicle-01" | "vehicle-02" | "vehicle-03"
  lat: number;
  lng: number;
  timestamp: string; // ISO 8601形式 例: "2026-04-23T10:00:00.000Z"
};
```

---

## 4. モックサーバー仕様（`server/mock-server.ts`）

### 概要

- ポート: `8080`
- プロトコル: WebSocket
- 実行コマンド: `npx tsx server/mock-server.ts`

### 管理車両

| vehicleId  | 初期緯度 | 初期経度 |
| ---------- | -------- | -------- |
| vehicle-01 | 35.6895  | 139.6917 |
| vehicle-02 | 35.6800  | 139.7000 |
| vehicle-03 | 35.7000  | 139.7100 |

### 送信ロジック

- 各車両を独立した `setInterval` で管理し、送信タイミングをずらす

| vehicleId  | 送信間隔    | 開始遅延        |
| ---------- | ----------- | --------------- |
| vehicle-01 | 1000ms ごと | 0ms（即時開始） |
| vehicle-02 | 1000ms ごと | 333ms 後に開始  |
| vehicle-03 | 1000ms ごと | 666ms 後に開始  |

- 各車両の座標は毎回 `±0.0005` の範囲でランダム変化（疑似移動）
- 実装: `setTimeout` で遅延させてから `setInterval` を開始する

### 送信データ形式

```json
{
  "vehicleId": "vehicle-01",
  "lat": 35.6897,
  "lng": 139.6914,
  "timestamp": "2026-04-23T10:00:01.000Z"
}
```

### クライアント接続

- 複数クライアント同時接続に対応（`wss.clients` でブロードキャスト）
- 接続・切断のログを `console.log` で出力

---

## 5. Zustand Store仕様（`src/store/positionStore.ts`）

```ts
type PositionStore = {
  positions: Map<string, VehiclePosition>; // key: vehicleId
  setPosition: (pos: VehiclePosition) => void;
};
```

- `setPosition` は `positions` に `vehicleId` をキーとして upsert する
- 初期値: `positions = new Map()`

---

## 6. WebSocket接続フック仕様（`src/hooks/useVehicleWebSocket.ts`）

```ts
export function useVehicleWebSocket(): void;
```

- `useEffect` 内で `new WebSocket('ws://localhost:8080')` を確立
- `onopen`: `console.log('WebSocket connected')` を出力
- `onmessage`: `JSON.parse(event.data)` → `VehiclePosition` にキャスト → `setPosition` を呼ぶ
- `onclose`: `console.log('WebSocket closed')` を出力
- `onerror`: `console.error(error)` を出力
- アンマウント時: `ws.close()` でクリーンアップ
- 再接続ロジック: なし（切断したらそのまま）

---

## 7. コンポーネント仕様

### 7-1. App.tsx

- `useVehicleWebSocket()` をトップレベルで1回呼ぶ（WebSocket接続を確立）
- 以下のレイアウトを描画する

```
┌──────────────────────────────────────────────────────┐
│  リアルタイム車両位置表示                               │
├──────────────────┬───────────────────────────────────┤
│  VehicleList     │  VehicleMap                       │
│  （左パネル）     │  （右：地図）                      │
│  幅: 280px       │  幅: 残り全部                      │
└──────────────────┴───────────────────────────────────┘
```

- レイアウトは CSS Flexbox で実装（外部CSSライブラリ不使用）

### 7-2. VehicleList.tsx

Zustand の `positions` を `Array.from` で配列化して表示。

**表示項目（1車両ごと）**:

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| 車両番号     | `vehicleId`（例: `vehicle-01`）                            |
| 緯度         | `lat`（小数点6桁表示）                                     |
| 経度         | `lng`（小数点6桁表示）                                     |
| 最終同期時刻 | `timestamp` をローカル時刻にフォーマット（例: `10:00:01`） |

- データが来るたびにリアルタイムで再描画
- 車両は `vehicleId` の昇順でソートして表示

### 7-3. VehicleMap.tsx

- `react-leaflet` の `MapContainer` / `TileLayer` / `Marker` / `Popup` を使用
- タイルレイヤー: OpenStreetMap（`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`）
- 初期表示: 緯度 `35.6895` / 経度 `139.6917` / ズーム `13`
- Zustand の `positions` を参照し、全車両分の `Marker` を描画
- `Marker` の `Popup` には `vehicleId` を表示
- `position` が空（Map サイズ 0）の場合はマーカーなし（地図は表示）
- **Leaflet のデフォルトアイコン欠損対策**を実装（詳細は下記注意事項を参照）

> **[注意] Leaflet デフォルトアイコン欠損問題**  
> react-leaflet を Vite（Webpack 含む）でバンドルすると、Leaflet が内部で参照する  
> マーカーアイコン画像（`marker-icon.png` / `marker-shadow.png`）のパスが壊れ、  
> マーカーが表示されない既知の問題がある。
>
> **原因**: Leaflet が `L.Icon.Default.prototype._getIconUrl` でアイコンURLを解決する際、  
> バンドラーの asset hashing によってパスが一致しなくなる。
>
> **対策**: `VehicleMap.tsx` の先頭で以下の workaround を実行する。
>
> ```ts
> import L from "leaflet";
> import iconUrl from "leaflet/dist/images/marker-icon.png";
> import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
> import shadowUrl from "leaflet/dist/images/marker-shadow.png";
>
> // [workaround] Viteバンドル時にLeafletのデフォルトアイコンパスが壊れる問題の回避
> // 参照: https://github.com/Leaflet/Leaflet/issues/4968
> delete (L.Icon.Default.prototype as any)._getIconUrl;
> L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });
> ```
>
> この処理はアプリ起動時に1回だけ実行すればよいため、`VehicleMap.tsx` のモジュールスコープに記述する。

---

## 8. package.json スクリプト

```json
{
  "scripts": {
    "dev": "vite",
    "server": "tsx server/mock-server.ts",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

起動手順:

1. `npm run server` でモックサーバー起動（ポート8080）
2. 別ターミナルで `npm run dev` でフロントエンド起動（ポート5173）
3. `http://localhost:5173` をブラウザで開く

---

## 9. 動作確認の定義（完了条件）

| 確認項目         | 期待する動作                                            |
| ---------------- | ------------------------------------------------------- |
| 地図表示         | OpenStreetMap タイルが表示される                        |
| マーカー表示     | 3台分のマーカーが地図上に表示される                     |
| リアルタイム移動 | 1秒ごとにマーカー位置が更新される                       |
| 車両一覧         | 左パネルに3台の座標・同期時刻がリアルタイムで更新される |
| コンソール       | 受信データが `console.log` で確認できる                 |
| クリーンアップ   | ブラウザタブを閉じると WebSocket が切断される           |

---

## 10. スコープ外（今回実装しない）

- WebSocket 再接続ロジック
- エラー画面・ローディング表示
- 車両の走行履歴（軌跡）表示
- 認証・セキュリティ
- テスト
