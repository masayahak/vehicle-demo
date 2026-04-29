# リアルタイム車両位置表示デモ

Zustand / WebSocket / Leaflet / React Router / BetterAuth の実践学習用プロジェクト。

詳細仕様は [SPEC.md](SPEC.md) を参照。

---

## 開発環境の起動（VSCode）

**F5 キー 1発で2サーバーを並列起動する。**

| ファイル              | 役割                                             |
| --------------------- | ------------------------------------------------ |
| `.vscode/launch.json` | F5 の起動設定（Chrome デバッグ + preLaunchTask） |
| `.vscode/tasks.json`  | 起動タスクの定義                                 |

### タスク実行フロー

```
F5
└─ dev:all（sequence）
     ├─ 1. kill-ports    ポート 3000 / 5173 を強制解放
     └─ 2. start-servers（parallel）
           ├─ vehicle-server    npm run server（port 3000）
           └─ vite-dev          npm run dev（port 5173）
```

**kill-ports タスクを先行させる理由:**
F5 を再押下するたびに前のプロセスが残り `EADDRINUSE` でサーバーが起動失敗する。
`fuser -k` で既存プロセスを強制終了してから起動することで、何度でも F5 で再起動できる。

---

## npm スクリプト（手動起動）

```bash
npm run dev     # Vite dev サーバー（port 5173）
npm run server  # 統合サーバー（port 3000）
npm run build   # プロダクションビルド
```
