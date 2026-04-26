# リアルタイム車両位置表示アプリ 詳細仕様書

**作成日**: 2026-04-23  
**更新日**: 2026-04-24  
**目的**: Zustand / WebSocket / Leaflet の実践学習

---

## 1. 技術スタック

| 役割                      | 技術                         | バージョン                        |
| ------------------------- | ---------------------------- | --------------------------------- |
| フロントエンド            | React SPA                    | 19.x                              |
| ビルドツール              | Vite                         | 8.x                               |
| 言語                      | TypeScript                   | 6.x                               |
| 状態管理                  | Zustand                      | 5.x                               |
| 地図                      | Leaflet + react-leaflet      | leaflet 1.9.x / react-leaflet 5.x |
| スタイリング              | Tailwind CSS                 | 4.x                               |
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
│   ├── constants/
│   │   └── vehicles.ts          # 車両カラー定数
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

## 4. 車両カラー定数（`src/constants/vehicles.ts`）

```ts
export const VEHICLE_COLORS: Record<string, string> = {
  "vehicle-01": "#2563EB", // 青
  "vehicle-02": "#DC2626", // 赤
  "vehicle-03": "#16A34A", // 緑
};
```

- `VehicleList` と `VehicleMap` の両方から参照する

---

## 5. モックサーバー仕様（`server/mock-server.ts`）

### 概要

- ポート: `8080`
- プロトコル: WebSocket
- 実行コマンド: `npx tsx server/mock-server.ts`

### 管理車両

| vehicleId  | 初期緯度 | 初期経度  |
| ---------- | -------- | --------- |
| vehicle-01 | 35.1815  | 136.9066  |
| vehicle-02 | 35.1700  | 136.9150  |
| vehicle-03 | 35.1950  | 136.8950  |

（名古屋市周辺）

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
  "lat": 35.1817,
  "lng": 136.9063,
  "timestamp": "2026-04-24T01:00:01.000Z"
}
```

### クライアント接続

- 複数クライアント同時接続に対応（`wss.clients` でブロードキャスト）
- 接続・切断のログを `console.log` で出力

---

## 6. Zustand Store仕様（`src/store/positionStore.ts`）

```ts
type PositionStore = {
  positions: Map<string, VehiclePosition>; // key: vehicleId
  setPosition: (pos: VehiclePosition) => void;
};
```

- `setPosition` は `positions` の `Map` をコピーして `vehicleId` をキーに upsert し、新しい参照を返す
- 新しい参照を返すことで、購読コンポーネントの再レンダリングがトリガーされる
- 初期値: `positions = new Map()`

---

## 7. WebSocket接続フック仕様（`src/hooks/useVehicleWebSocket.ts`）

```ts
export function useVehicleWebSocket(): void;
```

- `useEffect` 内で `new WebSocket('ws://localhost:8080')` を確立
- `onopen`: `console.log('WebSocket connected')` を出力
- `onmessage`: `JSON.parse(event.data)` → `VehiclePosition` にキャスト → `setPosition` を呼ぶ
- `onclose`: `console.log('WebSocket closed')` を出力
- `onerror`: `console.error(error)` を出力
- アンマウント時: `ws.close()` でクリーンアップ
- 依存配列: `[updateVehicle]`（store の参照が変わった場合に再接続）
- 再接続ロジック: なし（切断したらそのまま）

---

## 8. コンポーネント仕様

### 8-1. App.tsx

- `useVehicleWebSocket()` をトップレベルで1回呼ぶ（WebSocket接続を確立）
- Tailwind CSS で以下のレイアウトを描画する

```
┌──────────────────────────────────────────────────────┐
│  リアルタイム車両位置表示                               │
├──────────────────┬───────────────────────────────────┤
│  VehicleList     │  VehicleMap                       │
│  （左パネル）     │  （右：地図）                      │
│  幅: w-70（280px）│  幅: 残り全部（flex-1）            │
└──────────────────┴───────────────────────────────────┘
```

- 外側: `flex flex-col h-screen`
- ヘッダー: `px-4 py-2 border-b`
- コンテンツ行: `flex flex-1 overflow-hidden`
- 左パネル (`<aside>`): `w-70 shrink-0 overflow-y-auto border-r`
- 右エリア (`<main>`): `flex-1`

### 8-2. VehicleList.tsx

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
- `VEHICLE_COLORS` を参照し、車両ごとに色分けしたカードで表示
  - カード左ボーダー: 車両色
  - カード背景: 車両色 + 透明度（`color + "18"`）
  - 車両ID文字色: 車両色

### 8-3. VehicleMap.tsx

- `react-leaflet` の `MapContainer` / `TileLayer` / `Marker` / `Popup` を使用
- タイルレイヤー: OpenStreetMap（`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`）
- 初期表示: 緯度 `35.1815` / 経度 `136.9066` / ズーム `13`（名古屋市周辺）
- Zustand の `positions` を参照し、全車両分の `Marker` を描画
- `Marker` の `Popup` には `vehicleId` を表示
- `position` が空（Map サイズ 0）の場合はマーカーなし（地図は表示）

**マーカーアイコン**:

Leaflet のデフォルトアイコン（`marker-icon.png`）は使用しない。  
`L.divIcon` + インライン SVG で車両色のカスタムピンを生成する。

```ts
function createColoredIcon(color: string): L.DivIcon {
  const svg = `<svg ...><path fill="${color}" .../><circle .../></svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });
}
```

- `VEHICLE_COLORS` から車両色を取得し、未定義の場合は `#6B7280`（グレー）をフォールバックとして使用
- この方式により、Vite バンドル時の Leaflet デフォルトアイコンパス欠損問題を根本回避している

---

## 9. package.json スクリプト

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

## 10. 動作確認の定義（完了条件）

| 確認項目         | 期待する動作                                            |
| ---------------- | ------------------------------------------------------- |
| 地図表示         | OpenStreetMap タイルが表示される                        |
| マーカー表示     | 3台分のカラーピンが地図上に表示される                   |
| リアルタイム移動 | 1秒ごとにマーカー位置が更新される                       |
| 車両一覧         | 左パネルに3台の座標・同期時刻がリアルタイムで更新される |
| 色分け           | 車両ごとにピン色とリストカード色が一致している          |
| クリーンアップ   | ブラウザタブを閉じると WebSocket が切断される           |

---

## 11. スコープ外（今回実装しない）

- WebSocket 再接続ロジック
- エラー画面・ローディング表示
- 車両の走行履歴（軌跡）表示
- 認証・セキュリティ
- テスト

---

## 12. ルーティング仕様（React Router v6）

### 目的

React Router v6 の基本パターンを実践学習する。

### 使用ライブラリ

- `react-router-dom` v7.x

### ルート定義

| パス        | コンポーネント    | 説明                                  |
| ----------- | ---------------- | ------------------------------------- |
| `/`         | `LandingPage`    | 学習用デモであることを示すランディングページ |
| `/vehicles` | 既存の車両表示   | 現在のトップページをそのまま移動        |
| `/about`    | `AboutPage`      | このデモの概要・技術スタック説明        |
| その他      | `<Navigate>`     | `/` へリダイレクト                    |

### ナビゲーションバー（`NavBar.tsx`）

- 全ページ共通で最上段に表示
- リンク: `ホーム` / `車両表示` / `About`
- `<NavLink>` を使用し、現在ページのリンクをアクティブスタイルで強調
  - アクティブ: 下線 + 文字色変化（`aria-[aria-current=page]` または `isActive` コールバック）

### コンポーネント構成

```
src/
├── pages/
│   ├── LandingPage.tsx   # 新規
│   └── AboutPage.tsx     # 新規
├── components/
│   ├── NavBar.tsx        # 新規（全ページ共通ヘッダー）
│   ├── VehicleMap.tsx    # 既存（変更なし）
│   └── VehicleList.tsx   # 既存（変更なし）
└── App.tsx               # ルート定義を追加
```

### App.tsx の構造

```tsx
<BrowserRouter>
  <NavBar />
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/vehicles" element={<VehiclesPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
```

- 車両表示ページのレイアウト（`flex flex-col h-screen`）は `/vehicles` ルート内で完結させる
- NavBar の高さ分、車両表示ページの `h-screen` を調整する（`h-[calc(100vh-NavBarの高さ)]` など）

### LandingPage 仕様

- 「学習用デモ」と明示するシンプルなヒーローセクション
- 表示内容: タイトル / サブタイトル（使用技術の列挙） / 「車両表示を見る」ボタン（`/vehicles` へ遷移）

### AboutPage 仕様

- このプロジェクトの学習目的・技術スタックを簡潔に説明するページ
- 表示内容: 目的の説明 / 技術スタック一覧（Zustand / WebSocket / Leaflet / React Router）
