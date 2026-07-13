# Vercelステージングデプロイ手順書(TASK-30)

対象:このNext.jsアプリ(リポジトリ直下)をVercelへ接続し、ステージング環境(独自ドメイン未接続の
`*.vercel.app` URL)を用意する。本番ドメインの接続・切替はPhase 5(TASK-33/34)まで行わない。

Sanity Studio(`studio/`)は完全に別アプリのため、本手順ではデプロイ対象に含めない
(Studioは`sanity deploy`でSanity管理のホスティングへ別途デプロイする。必要になった時点で判断)。

## 1. Vercelプロジェクト接続(人間の作業)

1. https://vercel.com にログインし、"Add New..." > "Project" を選択
2. GitHubリポジトリ(`hagurumado-system`)を連携・選択
   - 初回連携時、VercelのGitHub Appにこのリポジトリへのアクセス権を付与する
3. Framework Presetは自動で"Next.js"が検出される(Root Directoryはリポジトリ直下のままでよい。
   `studio/`はデプロイ対象に含めないため変更不要)
4. Build & Output Settings はデフォルトのままでよい(`next build`、Next.js標準の出力)。
   `vercel.json`は用意していない(§5参照、意図的に不要と判断)
5. 環境変数(§2の一覧表)をこの時点でまとめて登録する(Vercelの新規プロジェクト作成画面、
   または作成後の Project Settings > Environment Variables から追加可能)
6. Production Branch(Vercelプロジェクト設定 > Git)は`main`のまま(既定)
7. デプロイを実行すると、`https://<プロジェクト名>-<ランダム文字列>.vercel.app`
   (例:`hagurumado-system-xxxx.vercel.app`)が自動的に割り当てられる。これがステージングURL。
   **カスタムドメインは接続しない**(Domainsタブで何も追加しない。Phase 5まで保留)

以降、このURLを本手順書内で `<staging-url>` と表記する。

## 2. 環境変数一覧表

| キー名 | 用途 | ステージング | 本番(Phase 5〜) | 備考 |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase接続先URL | 必須(devプロジェクト) | 必須(本番プロジェクト) | §4参照。dev/prodでプロジェクトを分ける |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonキー | 必須(dev) | 必須(prod) | 公開情報(RLSで保護) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase管理者キー(RLSバイパス) | 必須(dev) | 必須(prod) | **秘匿**。Vercelの環境変数はSecret扱いで登録すること |
| `NEXT_PUBLIC_SITE_URL` | sitemap/hreflang/OGP絶対URLの基点(TASK-28) | 必須:`<staging-url>` | 必須:本番ドメイン確定後に更新 | 未設定時`http://localhost:3000`にフォールバック(ローカル開発のみ) |
| `ANTHROPIC_API_KEY` | BASEインポート時のCSVパース(Claude API、A-16) | 必須 | 必須 | |
| `RESEND_API_KEY` | 注文確認等のメール送信 | 必須(テスト用送信元で可) | 必須 | ステージングでの誤送信を避けたい場合はRESEND側でテストドメイン/制限された送信先を使う運用にする |
| `STRIPE_SECRET_KEY` | Stripe決済(サーバー) | 必須:**テストモード**キー(`sk_test_`) | 必須:本番キー(`sk_live_`) | |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook署名検証 | 必須 | 必須 | §3のとおりエンドポイントごとに発行される値が異なるため、ステージング用・本番用で別の値になる |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (現状未使用) | 任意 | 任意 | Stripe CheckoutはホストされたリダイレクトフローのためStripe.js(公開可能キー)を直接使っていない。将来クライアント側でStripe Elements等を使う場合に備えて`.env.local.example`に残置 |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal Orders API | 必須:**Sandboxアカウント**の値 | 必須:Liveアカウントの値 | |
| `PAYPAL_WEBHOOK_ID` | PayPal Webhook検証 | 必須 | 必須 | Sandbox用Webhook ID(§3) |
| `PAYPAL_ENV` | `sandbox` / `live`切替 | `sandbox` | `live` | `live`以外は常にSandbox APIを使う実装(`src/lib/paypal/client.ts`) |
| `SANITY_PROJECT_ID` / `SANITY_DATASET` | Sanityプロジェクト参照 | 必須 | 必須 | Sanityは環境分離不要と判断(コンテンツCMSであり取引データを持たないため、dev/prodで同一プロジェクトを共有してよい。将来分離したくなった場合はデータセットを`staging`/`production`に分ければよい) |
| `SANITY_API_READ_TOKEN` | Sanity読み取りAPIトークン(Viewer権限) | 必須 | 必須 | |
| `SANITY_REVALIDATE_SECRET` | SanityのWebhook署名検証 | 必須 | 必須 | ステージング・本番で別の値にしてもよいが、Sanityプロジェクトが共有なら同じ値で運用しても問題ない |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4測定ID(TASK-29) | 任意(推奨:ステージング専用のGA4プロパティ、または本番プロパティ+内部トラフィックフィルタ) | 必須 | 未設定でもビルド・動作は問題ない(Cookie同意バナー自体が非表示になる) |

Vercelでは各変数を Production / Preview / Development のスコープごとに設定できる。
今回はステージングをVercelの"Production"環境として運用する(§1-6のとおりProduction Branch=main)ため、
上表の値はいずれも **Production環境スコープ** に登録すること。Preview(PRごとのプレビュー環境)を
別途使う場合は、そこにもdevプロジェクト向けの値を登録する。

## 3. Webhook外部URL設定(ステージング公開後、人間の作業)

いずれも `<staging-url>` を実際のVercelデプロイURLに置き換えること。

### Stripe
1. https://dashboard.stripe.com (テストモードのまま) > 開発者 > Webhook > エンドポイントを追加
2. エンドポイントURL:`<staging-url>/api/webhooks/stripe`
3. リッスンするイベント:`checkout.session.completed`(実装が処理するのはこのイベントのみ、
   `src/app/api/webhooks/stripe/route.ts`)
4. 発行された signing secret を `STRIPE_WEBHOOK_SECRET` としてVercelに設定 → 再デプロイ

### PayPal
1. https://developer.paypal.com > Apps & Credentials(Sandboxアプリ) > 該当アプリ > Webhooks
2. Webhook URL:`<staging-url>/api/webhooks/paypal`
3. イベント:`PAYMENT.CAPTURE.COMPLETED`(実装が処理するのはこのイベントのみ、
   `src/app/api/webhooks/paypal/route.ts`。なお決済確定の主経路は`checkout/paypal-return`での
   同期capture呼び出しであり、このWebhookは補助的な確認用)
4. 発行されたWebhook IDを `PAYPAL_WEBHOOK_ID` としてVercelに設定 → 再デプロイ

### Sanity
SETUP.md item7を参照(内容は同一。ここでは`<staging-url>`を実URLに置き換えて実施するだけ)。
1. Sanity管理画面 > API > Webhooks でWebhookを作成
2. URL:`<staging-url>/api/webhooks/sanity`
3. Secret:Vercelに設定済みの`SANITY_REVALIDATE_SECRET`と同じ値
4. Projection:`{"_type": _type, "slug": slug.current, "productCode": productCode}`

## 4. Supabase dev/prodプロジェクトの分離確認

- **devプロジェクト**:これまでの開発・TASK-31移行リハーサルで使用してきたSupabaseプロジェクト。
  ステージング(Vercel)はこのdevプロジェクトの`NEXT_PUBLIC_SUPABASE_URL`等を参照する
- **本番(prod)プロジェクト**:Phase 5(TASK-33本番移行)で新規作成し、実データを投入する別プロジェクト。
  本番Vercelデプロイ(Phase 5でカスタムドメインを接続する際)はこちらを参照するよう環境変数を
  差し替える
- 2つのプロジェクトを混同しないよう、Supabaseダッシュボードのプロジェクト名に`hagurumado-dev` /
  `hagurumado-prod`のように用途が分かる名前を付けておくことを推奨する
- Stripe/PayPalも同様にテストモード(dev)とライブモード(prod)の認証情報を混同しないこと(§2参照)

## 5. vercel.jsonについて(作成しないと判断)

以下の理由により、`vercel.json`は現時点で不要と判断した:
- ビルドコマンド・出力形式はNext.jsのゼロコンフィグ検出に委ねられ、上書きの必要がない
- 画像最適化ドメインは`next.config.mjs`の`images.remotePatterns`で既に設定済み(Vercel側の追加設定不要)
- 日次/時間ごとのバッチ処理(受注自動制御・pending注文のタイムアウト処理)はPostgresの`pg_cron`で
  Supabase側に実装済み(`supabase/migrations/20260712000017_order_acceptance_cron.sql`、
  `20260712000022_shipping_stripe_checkout.sql`)。Vercel Cron(`vercel.json`の`crons`)への移設は
  行わない。pg_cronはPostgres内で完結し外部HTTP呼び出しを経由しないため、Vercel Cron
  (HTTPエンドポイントを叩く方式)へ移すと「Vercel→Next.js API Route→Supabase」という余分な
  ホップと失敗点が増えるだけで利点がない。Supabase側で完結する現状の実装を維持する
- リダイレクト/リライト/カスタムヘッダーは現時点で不要(ロケールルーティングは`src/middleware.ts`で
  処理済み)
- 関数のリージョン指定(Supabase Tokyoリージョンとのレイテンシ低減)は、プランによって
  `vercel.json`の`regions`指定が使えない場合があるため、まずはVercelダッシュボードの
  Project Settings > Functions > Function Region から手動設定することを推奨する
  (Hobbyプランでは選択できない場合がある。その場合はプラン制約として許容する)

## 6. 既知の注意点(TASK-31以降で要検証)

- BASEインポート(A-16、顧客約1,300件+全注文履歴)はServer Action
  (`src/app/admin/(dashboard)/base-import/actions.ts`の`importBaseOrders`)内でループ処理しており、
  件数次第ではVercelのServerless Function実行時間上限(Hobbyプラン既定10秒、Next.jsの
  `maxDuration`route segment configで延長可能。Pro以上でより長く設定可能)を超える可能性がある。
  TASK-31の移行リハーサルで実際の所要時間を計測し、上限に近い・超える場合は
  `export const maxDuration = ...`をactions.tsに追加するか、インポートをバッチ分割する対応を検討すること
  (本タスクの時点ではプランが未確定のため、コード変更は行わずここに記録するのみとする)

## 7. 動作確認チェックリスト(人間の作業、受入条件)

ステージングURL(`<staging-url>`)にアクセスし、以下を確認する:
- [ ] トップページ(`/ja`, `/en`)が表示される
- [ ] 商品一覧・商品詳細が表示され、カスタマイズ→カート追加ができる
- [ ] チェックアウトでStripeテストカード(`4242 4242 4242 4242`等)による決済が完了し、
      注文完了ページに遷移する
- [ ] チェックアウトでPayPal Sandboxアカウントによる決済が完了する
- [ ] 注文確認メールが届く(Resend経由)
- [ ] `/admin`にログインし、管理画面(受注一覧・生産キュー等)が表示される
- [ ] `/sitemap.xml`・`/robots.txt`が正しいステージングURLで生成される
      (`NEXT_PUBLIC_SITE_URL`が正しく反映されているか確認)
- [ ] Sanity Studioで編集した内容(ガイド・ブログ・サイト設定)がWebhook経由でフロントに反映される
