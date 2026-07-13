# TASK-30 Vercelステージングデプロイ
担当:Sonnet(手順書作成+設定ファイル)+人間(コンソール操作) / 依存:TASK-28 / 目安:4h

## 作業
1. Vercelプロジェクト接続手順書の作成(GitHubリポジトリ連携、環境変数一覧表:キー名/用途/本番・ステージング別の値の要否)
2. ステージング環境:mainブランチ→Preview URL(hagurumado-system-xxx.vercel.app)。本番ドメイン接続はPhase 5まで行わない
3. Webhook外部URL設定:Stripe/PayPal/SanityのWebhook先をステージングURLに設定する手順書
4. Supabase本番プロジェクトとステージングの分離確認(SETUP.mdのdev/prod 2プロジェクト構成)。ステージングはdevプロジェクトを参照
5. vercel.json(必要なら)、ビルド設定、Edge Function(cron)のVercel Cron移設判断(Supabase cronのままで可。理由をコメント)

## 受入条件
- [ ] ステージングURLで全機能(決済テストモード含む)が動作 — **人間による確認待ち**(下記メモ参照)
- [x] 環境変数一覧表が完成しSETUP.mdに追記されている

## 実施結果メモ(2026-07-13)

### 実施内容(Sonnet担当分:手順書作成+設定ファイル)
本タスクは指示書自体が「担当:Sonnet(手順書作成+設定ファイル)+人間(コンソール操作)」と
明記されているとおり、Vercel/Stripe/PayPal/Sanityの実際のコンソール操作(GitHubリポジトリ連携、
環境変数登録、Webhook登録、デプロイ実行)は人間側の作業であり、本サンドボックスにVercel等の
実アカウントアクセスがないため実施できない。Sonnet側では以下を用意した:

- `docs/vercel-deploy.md`(新規):
  1. Vercelプロジェクト接続手順(GitHubリポジトリ連携→環境変数登録→Production Branch=main→
     カスタムドメイン未接続のまま`*.vercel.app`ステージングURLを得る、の順)
  2. 環境変数一覧表(全17個:`NEXT_PUBLIC_SUPABASE_URL`から`NEXT_PUBLIC_GA_MEASUREMENT_ID`まで、
     実際に`process.env`参照しているキーを`grep`で洗い出して網羅。用途・ステージング/本番での
     要否・注意点(テストモード/Liveモードの区別、秘匿情報の扱い等)を記載。
     `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`は現状コード内で未使用であることも明記(Stripe Checkoutが
     ホスト型リダイレクトのためStripe.js不要と判明したため。削除はスコープ外として現状維持)
  3. Webhook設定手順(Stripe:`checkout.session.completed`のみ、PayPal:`PAYMENT.CAPTURE.COMPLETED`
     のみ受信すればよいことを実装コードから確認して明記。Sanityは既存のSETUP.md item7を参照)
  4. Supabase dev/prodプロジェクトの分離方針(devは開発・ステージング共用、prodはPhase 5で新規作成)
  5. vercel.jsonを**作成しない**という判断とその理由(ビルド設定はNext.jsのゼロコンフィグ検出で
     十分、画像最適化ドメインは`next.config.mjs`で設定済み、cronはSupabase pg_cronのまま維持
     (理由:pg_cronはPostgres内で完結し外部HTTP呼び出しを経由しないため、Vercel Cronへ移設すると
     Vercel→API Route→Supabaseという余分なホップが増えるだけで利点がない)、リージョン指定は
     プラン依存のためVercelダッシュボードでの手動設定を推奨、の5点を整理)
  6. 既知の注意点:BASEインポート(顧客約1,300件+全注文履歴、TASK-31で実施)がServer Action内の
     ループ処理のため、VercelのServerless Function実行時間上限(プラン依存)を超える可能性がある旨を
     記録。プラン未確定の現時点ではコード変更(`maxDuration`追加等)は行わず、TASK-31実施時に
     実測のうえ必要なら対応する方針とした
  7. 動作確認チェックリスト(受入条件「全機能が動作」を人間が実際にステージングURLで確認する際の
     具体的な確認項目リスト)
- `SETUP.md`:項目1(Supabaseプロジェクト作成)にdev/prod運用方針の注記を追加。新規項目9として
  `docs/vercel-deploy.md`への導線を追加。

### 検証
- `npm run typecheck` / `npm run lint`:ドキュメントのみの変更のためエラーなし(コード変更なし)。
- Stripe/PayPal Webhookが処理するイベント種別は、実装コード(`src/app/api/webhooks/stripe/route.ts`
  ・`src/app/api/webhooks/paypal/route.ts`)を実際に読み、`checkout.session.completed`・
  `PAYMENT.CAPTURE.COMPLETED`のみが処理対象であることを確認したうえで手順書に反映した(推測で
  書いていない)。
- 環境変数一覧は`grep -rohE "process\.env\.[A-Z_]+" src/`で実際のコード参照を全件洗い出し、
  漏れがないことを確認した。

### 未実施(人間の作業として残っている事項)
- Vercelプロジェクトの実際の作成・GitHub連携・環境変数登録・デプロイ実行
- Stripe/PayPal/SanityのWebhookエンドポイント登録(ステージングURL確定後)
- `docs/vercel-deploy.md` §7のチェックリストに沿った実機での全機能動作確認
- 上記が完了し次第、受入条件1つ目のチェックボックスを人間側でチェックすること
