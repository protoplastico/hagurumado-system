# セットアップ手順(人間が行う作業)

Claude Codeでの開発開始前に、以下を**ご自身で**準備してください(アカウント作成・認証情報の取り扱いはAIには任せられません)。

## 1. アカウント準備
1. Supabase(https://supabase.com)— 新規プロジェクト作成(リージョン:Tokyo)。このプロジェクトは
   開発・ステージング共用の**devプロジェクト**として扱う。Phase 5(TASK-33本番移行)で実データ用の
   別プロジェクト(**prodプロジェクト**)を新規作成するまでは、これ1つのみでよい
2. Vercel(https://vercel.com)— アカウントのみ(デプロイはPhase 1完了後。実際の接続手順はTASK-30
   `docs/vercel-deploy.md`参照)
3. GitHub — 空のプライベートリポジトリ作成(例:hagurumado-system)

## 2. 認証情報
Supabaseプロジェクトの Settings > API から以下を控える:
- Project URL
- anon public key
- service_role key(秘匿。絶対に公開しない)

## 3. Claude Codeでの開始手順
```bash
# 1. リポジトリをクローンし、本パッケージの中身を配置
git clone <your-repo> && cd <your-repo>
# CLAUDE.md, docs/, tasks/ をリポジトリ直下にコピー

# 2. Claude Code起動(実装はSonnet指定でコスト効率化)
claude --model sonnet

# 3. 最初の指示(例)
「CLAUDE.mdを読み、tasks/phase1/TASK-01から順に着手してください」
```

## 4. .env.local(TASK-01完了後に作成)
```
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

## 5. TASK-09の前に必要な作業
BASE管理画面 > 注文/顧客 からCSVをエクスポートし、カラム構成をClaude Codeに提示すること(個人情報行は取込作業時のみ使用。リポジトリにコミットしない)。

## 6. TASK-25の前に必要な作業(Sanity)
1. https://sanity.io/manage でアカウント作成・プロジェクト作成(無料プランで可)
2. プロジェクトのProject IDを控える
3. データセットは`production`という名前で作成(新規プロジェクトなら自動作成されていることが多い)
4. プロジェクト設定 > API > Tokens で「Viewer」権限のAPIトークンを発行して控える(再表示不可)
5. 以下を`.env.local`(リポジトリ直下、Next.js用)に設定:
   ```
   SANITY_PROJECT_ID=<Project ID>
   SANITY_DATASET=production
   SANITY_API_READ_TOKEN=<発行したトークン>
   SANITY_REVALIDATE_SECRET=<任意の推測困難な文字列。SanityのWebhook設定時にも同じ値を使う>
   ```
6. Sanity Studio(`studio/`ディレクトリ)を起動する場合は、`studio/.env.local`に以下を設定:
   ```
   SANITY_STUDIO_PROJECT_ID=<Project ID>
   SANITY_STUDIO_DATASET=production
   ```
   (`cd studio && npm install && npm run dev` でローカル起動。既定ポート3333)
7. Webhook設定(コンテンツ編集をフロントへ即時反映させたい場合、TASK-30のステージング公開後に設定):
   Sanity管理画面 > API > Webhooks で `<デプロイ先URL>/api/webhooks/sanity` 宛にPOSTするWebhookを作成し、
   Secretに上記`SANITY_REVALIDATE_SECRET`と同じ値を設定。投影(Projection)は
   `{"_type": _type, "slug": slug.current, "productCode": productCode}` とすること。

## 7. TASK-28以降で使う`NEXT_PUBLIC_SITE_URL`
sitemap.xml・hreflang・OGP画像URLなど、絶対URLの組み立てに使う。`.env.local`に以下を追加:
```
NEXT_PUBLIC_SITE_URL=https://<デプロイ先のドメイン>
```
ローカル開発時・未設定時は`http://localhost:3000`にフォールバックする。TASK-30でVercelのステージングURLが決まり次第、正しい値に更新すること。

## 8. TASK-29の前に必要な作業(GA4)
1. https://analytics.google.com でGA4プロパティを作成(ウェブストリームを追加)
2. 発行された測定ID(`G-XXXXXXXXXX`形式)を控える
3. `.env.local`に以下を設定:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=<測定ID>
   ```
   未設定のままでもビルド・動作は問題ない(Cookie同意バナー自体が表示されず、GAは読み込まれない)。
4. テスト購入の確認は、GA4管理画面 > 管理 > DebugView で行う(開発時は`?debug_mode=1`等は使わず、
   Chrome拡張「Google Analytics Debugger」またはGA4の`debug_mode`パラメータ付き手動テストで確認すること)。

## 9. TASK-30: Vercelステージングデプロイ
手順・環境変数一覧表・Webhook設定・既知の注意点は `docs/vercel-deploy.md` にまとめた。
GitHubリポジトリ連携、環境変数の登録、Stripe/PayPal/SanityのWebhook先URL設定は
すべて人間の作業(Vercel/各サービスのコンソール操作)が必要なため、そちらを参照して実施すること。

## 進行管理
- 各TASK完了ごとにコミットが積まれる。動作確認して次へ
- 設計変更が必要になった場合はこのチャット(Fable)に戻して判断
