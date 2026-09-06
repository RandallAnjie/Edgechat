> RandallFlare fork (`T-20260906-01`): `@bigrandall/rrangler` only. See [README.md](README.md). Attribution: Randall.

<div align="center">
  <img src="Edgechat.png" alt="EdgeChat" width="640" />

  <h3>Cloudflare フルスタックで作られたモダンなチーム向けチャットシステム</h3>
	  <p>アカウント体系 · 公開/プライベートグループ · ダイレクトメッセージ · リアルタイムメッセージ · ボイスメッセージ · ファイルアップロード · 管理ダッシュボード</p>

  <p>
    <img src="https://img.shields.io/github/license/aozorae/Edgechat?style=flat-square&color=blue" alt="license" />
    <img src="https://img.shields.io/github/stars/aozorae/Edgechat?style=flat-square&color=orange" alt="stars" />
    <img src="https://img.shields.io/github/forks/aozorae/Edgechat?style=flat-square" alt="forks" />
    <img src="https://img.shields.io/github/issues/aozorae/Edgechat?style=flat-square" alt="issues" />
    <img src="https://img.shields.io/github/last-commit/aozorae/Edgechat?style=flat-square" alt="last commit" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/Vue.js-3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white" alt="Vue 3" />
    <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
    <img src="https://img.shields.io/badge/Hono-E36002?style=flat-square&logo=hono&logoColor=white" alt="Hono" />
    <img src="https://img.shields.io/badge/Durable_Objects-WebSocket-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Durable Objects" />
    <img src="https://img.shields.io/badge/GPL--3.0--or--later-A42E2B?style=flat-square&logo=gnu&logoColor=white" alt="GPL-3.0-or-later" />
    <img src="https://img.shields.io/badge/Telegram-双向消息桥接-26A5E4?style=flat-square&logo=telegram&logoColor=white" alt="Telegram Bridge" />
  </p>

  <p>
    <a href="README.md">中文</a> ·
    <a href="README.en.md">English</a> ·
    <a href="README.ja.md"><b>日本語</b></a> ·
    <a href="https://edgechat-demo.gdz66601.workers.dev">オンラインデモ</a> ·
    <a href="https://echat.azora.top/">プロジェクトドキュメント</a> ·
    <a href="https://t.me/EdgeChatlounge">Telegram コミュニティ</a>
  </p>

  > ***これは 1,000万人未満のチームに最適な Cloudflare チャットルームかもしれません***
</div>

<br />

EdgeChat は Cloudflare 上にデプロイするチーム向けチャットシステムです。アカウント体系、公開グループ、プライベートグループ、ダイレクトメッセージ、リアルタイムメッセージ、ボイスメッセージ、ファイルアップロード、管理ダッシュボードをひととおり揃えています。目標は明確です。Cloudflare エコシステムの中で、できるだけ低い運用コストで、そのまま本番投入できるサイト内 IM を動かすことです。

## 最新アップデート

> **実験的な WebMCP 対応**：EdgeChat は、OpenAI が最近公開した実験的な [Site tools（WebMCP）](https://learn.chatgpt.com/docs/webmcp) 機能にいち早く対応しました。ChatGPT デスクトップアプリの内蔵ブラウザで ChatGPT Work または Codex から EdgeChat を開いてログインすると、AI がサイトのチャットツールを直接検出して呼び出せます。通常のブラウザ、既存 UI、Worker のコアプロトコルには影響しません。

| ツール | 機能 | 状態 |
|---|---|---|
| `edgechat.login` | ログインして現在のブラウザセッションを作成 | ✅ |
| `edgechat.list_channels` | ユーザーが閲覧できるグループを取得 | ✅ |
| `edgechat.read_messages` | ルームの最近のメッセージを取得 | ✅ |
| `edgechat.send_message` | 指定したルームへメッセージを送信 | ✅ |
| `edgechat.open_dm` | ユーザーとの DM を検索または開始 | ✅ |

ログインツールは既存の認証フローとブラウザの安全確認を利用し、結果にパスワードや session token を含めません。

## 目次

- [インターフェースプレビュー](#インターフェースプレビュー)
- [オンラインデモ](#オンラインデモ)
- [注目機能：Telegram 双方向メッセージブリッジ](#注目機能telegram-双方向メッセージブリッジ)
- [なぜ EdgeChat なのか](#なぜ-edgechat-なのか)
- [機能](#機能)
- [技術スタック](#技術スタック)
- *[Telegram コミュニティ](#telegram-コミュニティ)*
- [デプロイ](#デプロイ)
- [クイックスタート](#クイックスタート)
- [プロジェクト構成](#プロジェクト構成)
- [コントリビューション](#コントリビューション)
- [Star History](#star-history)
- [ライセンス](#ライセンス)

## インターフェースプレビュー

<table>
  <tr>
    <td width="50%" align="center"><strong>チャット画面</strong></td>
    <td width="50%" align="center"><strong>管理ダッシュボード</strong></td>
  </tr>
  <tr>
    <td width="50%"><img src="assets/previews/chat-home.png" alt="EdgeChat チャット画面プレビュー" width="100%" /></td>
    <td width="50%"><img src="assets/previews/admin-dashboard.png" alt="EdgeChat 管理ダッシュボードプレビュー" width="100%" /></td>
  </tr>
</table>

## オンラインデモ

**[edgechat-demo.gdz66601.workers.dev](https://edgechat-demo.gdz66601.workers.dev)**

デモサイトは本番プロジェクトの Vue ページ、ルーティング、状態管理、リアルタイムメッセージのロジックをそのまま再利用していますが、すべての API・WebSocket・ファイルアップロード・Telegram のやり取りはブラウザのメモリ内でシミュレーションされます。ページをリロードするか、右上の「**デモデータをリセット**」をクリックすると初期状態に戻ります。本番 Worker には一切アクセスせず、D1・KV・R2 への書き込みも発生しません。

## 注目機能：Telegram 双方向メッセージブリッジ

管理者は EdgeChat 内の任意のグループを Telegram グループにバインドできます。バインドすると、Telegram Bot 経由で両側のメッセージが**双方向にリアルタイム転送**されます。EdgeChat のメンバーが送信したメッセージは Telegram グループにも表示され、Telegram グループのメッセージも EdgeChat に表示されます。両側のメンバーはあたかも同じグループで会話しているかのように使えるため、アプリを切り替えたりグループを二重に作ったりする必要はまったくありません。

<div align="center">
  <img
    src="https://github.com/user-attachments/assets/eb5d6b5a-4664-41c6-a760-02c4a1398b36"
    alt="EdgeChat と Telegram の双方向メッセージブリッジのデモ"
    width="90%"
  />
  <br />
  <sub>リアルタイムでシームレスに転送、双方向同期</sub>
</div>

## なぜ EdgeChat なのか

| | EdgeChat | 自前ホスティングの Rocket.Chat / Mattermost | 商用 SaaS IM |
|---|---|---|---|
| デプロイコスト | Cloudflare の無料枠で運用可能 | 常駐サーバー / コンテナが必要 | 人数単位のサブスク課金 |
| 運用負担 | サーバー管理不要、Serverless | データベースやキャッシュを自前で運用 | 運用不要だが制御不能 |
| データの帰属 | 完全に自分の Cloudflare アカウント内 | 完全に自前で保持 | データは第三者に |
| 導入方法 | GitHub Actions でワンクリック自動デプロイ | 手動 / Docker Compose | 登録するだけ |

> この比較表はあくまで大まかな選定の参考です。実際に合うかどうかはチームの規模やニーズ次第です。Issue での議論・ご指摘をお待ちしています。

## 機能

**💬 メッセージと会話**
- 公開グループ、プライベートグループ、ダイレクトメッセージの会話に対応
- [Telegram グループ双方向メッセージブリッジ](#注目機能telegram-双方向メッセージブリッジ)：1 つの Bot で両側のメンバーをつなぐ
- リアルタイムメッセージ、履歴のページング、Telegram 風ボイスメッセージ、ファイルメッセージ
- Web では Telegram 風の返信、引用元へのジャンプ、返信を含む「メンション」優先通知に対応
- Web / Android の録音、波形シーク、倍速再生、Telegram voice/audio の双方向同期
- ファイルアップロードとアバター管理
- 期限切れメッセージの定期ハード削除に対応

**🔐 プライバシーとセキュリティ**
- 新しく書き込まれたメッセージと新しくアップロードされた添付ファイルは AES-256-GCM でサーバー側暗号化。履歴データへの一括バックフィルは行わない
- 管理ダッシュボードにはグループやダイレクトメッセージの本文を閲覧する入口を用意しない
- ユーザーは管理者が作成し、自己登録は開放しない

**🛠 管理ダッシュボード**
- ダッシュボード、ユーザー管理、登録招待、サイト設定のファーストレベルナビゲーション
- ユーザーを永久停止、または日・時間・分単位で一時停止可能。期限切れ後は定期ジョブなしで自動的に利用可能へ戻る
- ブラウザからソースリポジトリと直接比較し、現在のデプロイに更新があるか確認

**🎨 体験**
- モダンな Liquid Glass スタイルのインターフェース
- モバイル対応、基本的なアクセシビリティ対応

## 技術スタック

<p>
  <img src="https://img.shields.io/badge/Frontend-Vue_3_·_Vue_Router_·_Vite-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white" alt="frontend" />
  <img src="https://img.shields.io/badge/Backend-Cloudflare_Workers_·_Hono-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="backend" />
  <br />
  <img src="https://img.shields.io/badge/Realtime-Durable_Objects_(WS_Hibernation)-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="realtime" />
  <img src="https://img.shields.io/badge/Database-Cloudflare_D1-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="d1" />
  <img src="https://img.shields.io/badge/Session-Cloudflare_KV-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="kv" />
  <img src="https://img.shields.io/badge/Files-Cloudflare_R2-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="r2" />
  <br />
  <img src="https://img.shields.io/badge/Deploy-Wrangler_·_GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white" alt="deploy" />
</p>

## Telegram コミュニティ

[Telegram コミュニティ](https://t.me/EdgeChatlounge) にぜひご参加ください。他のユーザーや開発者と交流し、フィードバックを共有し、プロジェクトの最新情報を受け取れます。

## デプロイ

### GitHub Actions 自動デプロイ（推奨）

GitHub Actions でのデプロイを優先的に推奨します。長期的なメンテナンスと本番環境の更新に適しています。リポジトリには `.github/workflows/deploy-worker.yml` が用意されており、`master` または `main` へのプッシュ、あるいは手動の `workflow_dispatch` トリガーで自動デプロイが実行されます。

- クイックスタート：<https://echat.azora.top/guide/getting-started.html>
- 詳細チュートリアル：<https://echat.azora.top/guide/actions-deploy.html>

### Android クライアント

現在の Android 向け主要リリースは `capacitor/` クライアントです。APK に Vue Web UI を直接同梱し、システムのファイル選択、通知、マイク権限、通知から会話を開く処理、外部リンクだけを小さな Kotlin ブリッジで実装します。Application ID は `com.aozorae.edgechat.web` で、初回ログイン時に利用者自身の EdgeChat HTTPS サーバー URL を入力するため、特定のデプロイ先には固定されません。

- インストール：GitHub Releases から `edgechat-*.apk` を取得し、`SHA256SUMS.txt` を確認
- 初回利用：ログイン画面で自分の EdgeChat HTTPS サーバー URL、ユーザー名、パスワードを入力
- ローカルビルド：JDK 21 と Android SDK 36 を用意して `npm run build:capacitor` を実行
- Debug APK：`capacitor/android/app/build/outputs/apk/debug/app-debug.apk`
- CI：`.github/workflows/capacitor-android-ci.yml` が `edgechat-capacitor-debug` をアップロード
- リリース：`android-v*` タグ、または手動の `Android Release` を使用し、4 つの `ANDROID_KEYSTORE_*` Secret から署名済み APK/AAB を生成
- サーバー切替：ログアウト後に URL を変更でき、別インスタンスへ切り替えると以前のトークンを削除します
- 制限：現時点では Room オフライン DB、WorkManager Outbox、FCM を含まないため、アプリがメッセージを受信できない間の即時通知は保証しません

`android/` の Kotlin + Jetpack Compose ネイティブクライアントは一時的に非推奨となり、既定のリリース対象ではありません。ソース、API v1 契約、独立 CI は過去の検証と将来の再評価のため残しますが、新規インストールと通常更新には Capacitor 版を使用してください。

詳細：<https://echat.azora.top/en/guide/android.html>

<details>
<summary><strong>🔐 プライバシーとサーバー側暗号化の説明（クリックで展開）</strong></summary>

<br />

GitHub Actions がサーバー側暗号化の Worker Secrets を管理します。初回デプロイ時に、対象 Worker に暗号化 Secret が存在しない場合、ワークフローがランダムな 32 バイトの AES キーを自動生成し、独立したバージョン管理された Secret として注入して、現在の active key ID を記録します。以降の通常デプロイではこれらの Secret の存在を確認するだけで、再生成・上書き・ローテーションは行いません。本番環境に既存の `EDGECHAT_ENCRYPTION_KEYRING` JSON キーリングもそのまま保持され、引き続き互換性があります。

デプロイ後に新しく書き込まれたメッセージ本文と新しくアップロードされた添付ファイルは自動的に暗号化されます。過去の D1 メッセージと R2 添付ファイルはそのまま残り、読み取り時は過去の平文と新しい暗号文の両方に対応します。Cron や定期タスク、デプロイスクリプトで全履歴データを一括暗号化することはありません。

キーを手動で指定する場合は、以下の形式で `EDGECHAT_ENCRYPTION_KEYRING` という名前の GitHub Repository Secret を作成します：

```json
{"activeKeyId":"v1","keys":{"v1":"BASE64_ENCODED_32_BYTE_KEY"}}
```

初回デプロイではこの値がそのまま採用されます。既存の Worker を自動で段階的にローテーションする場合は、`Deploy Worker` を手動で実行し `rotate_encryption_key` にチェックを入れます。ワークフローはバージョン管理されたキー Secret を 1 つ追加して active key ID を新しいバージョンに切り替えるだけで、すべての古い Secret と旧 JSON キーリングは変わりません。新しいメッセージは新しい active key を使用し、古い暗号文は引き続きそれぞれのエンベロープ内の key ID で復号されます。

`apply_encryption_keyring` は予備の手動上書き用エントリです。使用する場合は、Repository Secret に完全な JSON キーリングが必要で、`keys` には過去の暗号文から参照されている古い key ID をすべて残し、新しい key を追加して `activeKeyId` を更新します。古い key を削除すると、対応する過去の暗号文が永久に読み取れなくなります。`apply_encryption_keyring` と `rotate_encryption_key` を同じ実行で同時に有効にすることはできません。

これはサーバー側の保存時暗号化であり、エンドツーエンド暗号化ではありません。Worker はセッション権限チェックを通過した後に内容を復号するため、Cloudflare Worker の実行環境とキーを管理するデプロイ側は依然として信頼境界の内側にあります。それに伴うプライバシー調整として、管理ダッシュボードのメッセージ検索と完全な会話閲覧ページおよびその API は削除済みです。管理者は引き続きメッセージ数などの集計統計を確認できます。

</details>

### 手動デプロイ / Docker

<details>
<summary>手動デプロイと Docker の説明をクリックして展開</summary>

<br />

ローカルで手動デプロイしたい場合は、手順・リソース準備・注意事項の詳細をドキュメントサイトでご覧ください：

- 手動デプロイチュートリアル：<https://echat.azora.top/guide/getting-started.html>
- ドキュメントトップ：<https://echat.azora.top/>
- Docker ローカルデプロイ：[DOCKER.md](DOCKER.md)

</details>

## クイックスタート

```bash
# 依存関係のインストール
npm install

# フロントエンド開発
npm run dev:frontend

# フロントエンドのみのデモ（独立したポートとビルドディレクトリ）
npm run dev:demo

# ローカルビルド
npm run build

# ローカル手動デプロイ
npm run deploy
```

<details>
<summary>その他のスクリプトの説明（demo ビルド / デプロイ、CI 環境変数）</summary>

<br />

```bash
# demo を独立ビルド
npm run build:demo

# 独立した demo Worker をデプロイ
npm run deploy:demo
```

demo は `wrangler.demo.toml` と `.github/workflows/deploy-demo.yml` を使用し、Worker 名は `edgechat-demo` です。GitHub Actions は手動トリガーのみ対応で、`DEMO_CLOUDFLARE_ACCOUNT_ID` と `DEMO_CLOUDFLARE_API_TOKEN` を読み取ります。既存の本番デプロイワークフローは変更されません。

非対話環境でデプロイする場合は、事前に `CLOUDFLARE_API_TOKEN` を設定する必要があります。

管理画面の更新チェックは、ビルド時に現在の GitHub リポジトリ・ブランチ・コミットを自動記録します。正確な結果を得るには、手動デプロイは Git リポジトリ内で、すでにプッシュ済みのクリーンなコミットを基にビルドしてください。ブラウザから GitHub Compare API を直接呼び出せるよう、ソースリポジトリは公開のままにする必要があります。このプロセスで定期タスクが作成されることはありません。

PowerShell の例：

```powershell
$env:CLOUDFLARE_API_TOKEN = "your-token"
npm run deploy
```

</details>

## プロジェクト構成

<details>
<summary>ディレクトリツリーをクリックして展開</summary>

```text
edgechat/
├─ assets/
│  └─ previews/
│     ├─ chat-home.png
│     └─ admin-dashboard.png
├─ frontend/
│  ├─ src/
│  │  ├─ api.js
│  │  ├─ router.js
│  │  ├─ store.js
│  │  ├─ ws.js
│  │  ├─ runtime.js
│  │  ├─ demo/
│  │  ├─ styles.css
│  │  ├─ components/ui/
│  │  └─ pages/
│  ├─ vite.config.js
│  └─ vite.demo.config.js
├─ worker/
│  ├─ schema.sql
│  ├─ migrations/
│  └─ src/
│     ├─ index.js
│     ├─ auth.js
│     ├─ db.js
│     ├─ middleware.js
│     ├─ utils.js
│     ├─ api/
│     └─ do/
├─ wrangler.toml
├─ wrangler.demo.toml
├─ package.json
├─ README.md
├─ README.en.md
├─ README.ja.md
└─ LICENSE
```

</details>

実装の詳細は [TECHNICAL.md](TECHNICAL.md) とドキュメントサイトをご覧ください：<https://echat.azora.top/>

## コントリビューション

Issue と Pull Request を歓迎します。EdgeChat を一緒に育てていきましょう。

プロジェクトに貢献してくださったすべての皆様に感謝します：

[![Contributors](https://contrib.rocks/image?repo=aozorae/Edgechat)](https://github.com/aozorae/Edgechat/graphs/contributors)

## Star History

<a href="https://www.star-history.com/?type=date&repos=aozorae%2FEdgechat">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=aozorae/Edgechat&type=date&theme=dark&legend=top-left&sealed_token=GpyqTbdwb3a2OHOT-WlCSoSzrumr3iwtcNluTpGbcU5CuyfP4eKf9TjtDuJ2uY4XK0P6knEB6OFCkbaAMsMCO3vnGPprGvB4f4rd7kmbUNe3fJ8LNaaGVH7JZLDT7SNNy3DC-sBxZwBmfL7gP9AFv1iKX1FgYnRZuOBGcKkbWFlBuoq2TXpYIfWmoUF9" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=aozorae/Edgechat&type=date&legend=top-left&sealed_token=GpyqTbdwb3a2OHOT-WlCSoSzrumr3iwtcNluTpGbcU5CuyfP4eKf9TjtDuJ2uY4XK0P6knEB6OFCkbaAMsMCO3vnGPprGvB4f4rd7kmbUNe3fJ8LNaaGVH7JZLDT7SNNy3DC-sBxZwBmfL7gP9AFv1iKX1FgYnRZuOBGcKkbWFlBuoq2TXpYIfWmoUF9" />
    <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=aozorae/Edgechat&type=date&legend=top-left&sealed_token=GpyqTbdwb3a2OHOT-WlCSoSzrumr3iwtcNluTpGbcU5CuyfP4eKf9TjtDuJ2uY4XK0P6knEB6OFCkbaAMsMCO3vnGPprGvB4f4rd7kmbUNe3fJ8LNaaGVH7JZLDT7SNNy3DC-sBxZwBmfL7gP9AFv1iKX1FgYnRZuOBGcKkbWFlBuoq2TXpYIfWmoUF9" />
  </picture>
</a>

スターをよろしくお願いします！

## ライセンス

このプロジェクトは [`GNU GPL v3.0 or later`](LICENSE) を採用しています。

本プロジェクトの使用・変更・再配布は自由です。変更版を再配布する場合は、対応するソースコードを引き続き提供し、GPL 互換を維持する必要があります。

## 謝辞

<a href="https://linux.do" target="_blank">linux do</a> による本プロジェクトのプロモーションへの貢献に感謝します。
