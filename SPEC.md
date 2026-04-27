# リアルタイム車両位置表示アプリ 詳細仕様書

**作成日**: 2026-04-23  
**更新日**: 2026-04-28  
**目的**: Zustand / WebSocket / Leaflet / React Router / Code Splitting の実践学習

---

## 1. 技術スタック

| 役割                      | 技術                         | バージョン                        |
| ------------------------- | ---------------------------- | --------------------------------- |
| フロントエンド            | React SPA                    | 19.x                              |
| ビルドツール              | Vite                         | 8.x                               |
| 言語                      | TypeScript                   | 6.x                               |
| 状態管理                  | Zustand                      | 5.x                               |
| ルーティング              | react-router-dom             | 7.x                               |
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
│   ├── pages/
│   │   ├── LandingPage.tsx      # トップページ
│   │   ├── VehiclesPage.tsx     # 車両表示ページ
│   │   └── AboutPage.tsx        # 概要ページ
│   ├── store/
│   │   └── positionStore.ts     # Zustand store
│   ├── hooks/
│   │   └── useVehicleWebSocket.ts
│   ├── components/
│   │   ├── NavBar.tsx           # 全ページ共通ヘッダー
│   │   ├── ConnectionStatusBar.tsx  # WS接続状態バー
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

| vehicleId  | 初期緯度 | 初期経度 |
| ---------- | -------- | -------- |
| vehicle-01 | 35.1815  | 136.9066 |
| vehicle-02 | 35.1700  | 136.9150 |
| vehicle-03 | 35.1950  | 136.8950 |

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
export type WsStatus = "connecting" | "connected" | "reconnecting" | "failed";

export function useVehicleWebSocket(): { status: WsStatus; nextRetryIn: number };
```

### 環境変数

| 変数名                  | 内容                        | デフォルト値           |
| ----------------------- | --------------------------- | ---------------------- |
| `VITE_WS_URL`           | WebSocket接続先URL          | `ws://localhost:8080`  |
| `VITE_WS_MAX_TOTAL_MS`  | 再接続を試みる最大累計時間  | `30000`（30秒）        |

### 通常動作

- `useEffect` 内で `new WebSocket(VITE_WS_URL)` を確立
- `onopen`: `retryCount` をリセットし `status` を `connected` にする
- `onmessage`: `JSON.parse(event.data)` → `VehiclePosition` にキャスト → `setPosition` を呼ぶ
- `onerror`: `console.error(error)` を出力
- アンマウント時: `shouldReconnect` フラグを `false` にして `ws.close()`、タイマーをすべてキャンセル
- 依存配列: `[updateVehicle]`

### 再接続ロジック

| 設定項目         | 値                                           |
| ---------------- | -------------------------------------------- |
| 再接続戦略       | Exponential backoff（`BASE_DELAY * 2^n` ms） |
| `BASE_DELAY`     | 1000ms（固定値、コード定数）                 |
| 上限             | 初回切断から累計 `VITE_WS_MAX_TOTAL_MS` 以内 |
| 上限到達時の動作 | `status` を `failed` にして再試行停止        |

**タイムライン例（MAX_TOTAL_MS=30秒の場合）**

```
t=0   切断
t=1   1回目 再接続試行（+1秒後）
t=3   2回目 再接続試行（+2秒後）
t=7   3回目 再接続試行（+4秒後）
t=15  4回目 再接続試行（+8秒後）
t=30  → failed（次の+16秒待つと累計30秒超のため打ち切り）
```

**実装ポイント**

- `shouldReconnect` フラグでアンマウントによる意図的な `ws.close()` と、サーバー起因の切断を区別する
- `onopen` より前に `onclose` が発火するケース（サーバー不在）があるため、`shouldReconnect = true` は `connect()` 呼び出し前にセットする
- `onclose` 時に `elapsed + nextDelay > MAX_TOTAL_MS` なら即 `failed`
- カウントダウン表示用に `setInterval` で `nextRetryIn` を1秒ずつ減算する（`prev` を使う関数形式でクロージャの値キャプチャ問題を回避）

---

## 8. ルーティング仕様

### ルート定義

| パス        | コンポーネント | 説明                                     |
| ----------- | -------------- | ---------------------------------------- |
| `/`         | `LandingPage`  | 学習用デモであることを示すランディングページ |
| `/vehicles` | `VehiclesPage` | リアルタイム車両表示                     |
| `/about`    | `AboutPage`    | このデモの概要・技術スタック説明         |
| その他      | `<Navigate>`   | `/` へリダイレクト                       |

### コード分割

- `LandingPage` / `AboutPage` は eager import（軽量なため分割対象外）
- `VehiclesPage` のみ `React.lazy` で遅延ロード
  - Leaflet / react-leaflet など重いライブラリを含むため、初回バンドルから除外する効果が大きい
  - `/vehicles` への初回遷移時にチャンクをフェッチ、再遷移時はキャッシュ済みのため再フェッチなし

---

## 9. コンポーネント仕様

### 9-1. App.tsx

ルーティング定義のみを担う。WebSocket 接続は持たない。

```tsx
// VehiclesPage のみ遅延ロード
const VehiclesPage = lazy(() => import("./pages/VehiclesPage"));

<BrowserRouter>
  <div className="flex flex-col h-screen">
    <NavBar />
    <div className="flex-1 overflow-y-auto">
      <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  </div>
</BrowserRouter>
```

- `<Suspense>` は `<Routes>` 全体を包む
- フォールバックは `/vehicles` への初回遷移時のみ表示される

### 9-2. NavBar.tsx

- 全ページ共通で最上段に表示
- リンク: `ホーム` / `車両表示` / `About`
- `<NavLink>` を使用し、現在ページのリンクをアクティブスタイルで強調
  - アクティブ: 下線 + 文字色変化

### 9-3. LandingPage.tsx

- 「学習用デモ」と明示するシンプルなヒーローセクション
- 表示内容: タイトル / サブタイトル（使用技術の列挙） / 「車両表示を見る」ボタン（`/vehicles` へ遷移）

### 9-4. AboutPage.tsx

- このプロジェクトの学習目的・技術スタックを簡潔に説明するページ
- 表示内容: 目的の説明 / 技術スタック一覧（Zustand / WebSocket / Leaflet / React Router）

### 9-5. VehiclesPage.tsx

- `useVehicleWebSocket()` をマウント時に1回呼び、`status` / `nextRetryIn` を受け取る
- `/vehicles` に遷移したときだけ WebSocket 接続が確立される
- `/vehicles` から離脱（アンマウント）すると接続がクリーンアップされ、再接続タイマーも停止する

```
┌──────────────────────────────────────────────────────┐
│  ConnectionStatusBar（接続中・再接続中・失敗時のみ表示）│
├──────────────────┬───────────────────────────────────┤
│  VehicleList     │  VehicleMap                       │
│  （左パネル）     │  （右：地図）                      │
│  幅: w-70（280px）│  幅: 残り全部（flex-1）            │
└──────────────────┴───────────────────────────────────┘
```

- 外側: `flex flex-col h-full`
- `ConnectionStatusBar` を最上部に配置
- 内側コンテンツ: `flex flex-1 overflow-hidden`
- 左パネル (`<aside>`): `w-70 shrink-0 overflow-y-auto border-r`
- 右エリア (`<main>`): `flex-1`

### 9-6. ConnectionStatusBar.tsx

- `status` が `connected` のときは `null` を返す（非表示）
- それ以外は車両一覧の最上部に固定バーとして表示

| status         | 背景色 | 表示メッセージ                                      |
| -------------- | ------ | --------------------------------------------------- |
| `connecting`   | 黄     | サーバーに接続中...                                 |
| `reconnecting` | 黄     | サーバーと切断されました。再接続中... (`n`秒後)     |
| `failed`       | 赤     | 接続できません。ページを再読み込みしてください。    |

- `reconnecting` 時は `nextRetryIn` を使ってカウントダウンを表示する

### 9-7. VehicleList.tsx

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

### 9-8. VehicleMap.tsx

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

## 10. package.json スクリプト

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

## 11. 動作確認の定義（完了条件）

| 確認項目             | 期待する動作                                                         |
| -------------------- | -------------------------------------------------------------------- |
| ルーティング         | `/` / `/vehicles` / `/about` それぞれのページが表示される           |
| 不正URL              | 未定義パスは `/` へリダイレクトされる                               |
| ナビゲーション       | NavBar の現在ページリンクがアクティブスタイルで強調される           |
| コード分割           | 初回ロード時 Network タブに VehiclesPage チャンクが含まれない       |
| 遅延ロード           | `/vehicles` 初回遷移時に VehiclesPage チャンクがフェッチされる      |
| WebSocket 接続       | `/vehicles` 遷移時に WebSocket が接続される                         |
| WebSocket 切断       | `/vehicles` から離脱すると WebSocket が切断される                   |
| 再接続               | サーバー停止後、Exponential backoff で再接続を試みる                |
| 再接続UI（黄）       | 再接続中に車両一覧上部に黄色バーとカウントダウンが表示される        |
| 再接続UI（赤）       | 累計30秒経過後に赤バーが表示され、再試行が停止する                  |
| 再接続成功           | サーバー再起動後に接続が回復し、バーが非表示になる                  |
| 地図表示             | OpenStreetMap タイルが表示される                                    |
| マーカー表示         | 3台分のカラーピンが地図上に表示される                               |
| リアルタイム移動     | 1秒ごとにマーカー位置が更新される                                   |
| 車両一覧             | 左パネルに3台の座標・同期時刻がリアルタイムで更新される             |
| 色分け               | 車両ごとにピン色とリストカード色が一致している                      |

---

## 12. スコープ外（今回実装しない）

- エラー画面
- 車両の走行履歴（軌跡）表示
- 認証・セキュリティ
- テスト
