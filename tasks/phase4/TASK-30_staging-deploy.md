# TASK-30 Vercelステージングデプロイ
担当:Sonnet(手順書作成+設定ファイル)+人間(コンソール操作) / 依存:TASK-28 / 目安:4h

## 作業
1. Vercelプロジェクト接続手順書の作成(GitHubリポジトリ連携、環境変数一覧表:キー名/用途/本番・ステージング別の値の要否)
2. ステージング環境:mainブランチ→Preview URL(hagurumado-system-xxx.vercel.app)。本番ドメイン接続はPhase 5まで行わない
3. Webhook外部URL設定:Stripe/PayPal/SanityのWebhook先をステージングURLに設定する手順書
4. Supabase本番プロジェクトとステージングの分離確認(SETUP.mdのdev/prod 2プロジェクト構成)。ステージングはdevプロジェクトを参照
5. vercel.json(必要なら)、ビルド設定、Edge Function(cron)のVercel Cron移設判断(Supabase cronのままで可。理由をコメント)

## 受入条件
- [ ] ステージングURLで全機能(決済テストモード含む)が動作
- [ ] 環境変数一覧表が完成しSETUP.mdに追記されている
