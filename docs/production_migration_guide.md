# 本番プロジェクトへの移行手順書(TASK-31作成 / 実行はTASK-33)

対象:devプロジェクトで構築・検証してきたスキーマとBASEインポート機能(A-16)を、Phase 5で新規作成する
**本番Supabaseプロジェクト**に対して適用し、実データを投入する手順。

**重要**:本書は手順の記録であり、実行そのものはTASK-33(本番移行実行)で人間+Claude Codeが行う。
実行には以下が必須で、いずれも本サンドボックスには存在しないため、TASK-31時点では準備のみ行った:
- 本番用Supabaseプロジェクトの実URL・service_role key
- BASE管理画面からエクスポートした最新・全期間の注文CSV・顧客CSV(実個人情報を含む)
- 国際価格の確定値(TASK-31作業項目3、人間の事業判断)

## 前提

- devプロジェクトでのリハーサル(TASK-31)が完了し、`supabase/verification/base_import_reconciliation.sql`
  による検証が全てパスしていること
- 商品マスタの国際価格が確定済み(TASK-17の仮置き値ではないこと)であり、公開する商品の
  `is_active`がtrueになっていること(2026-07-12 Fableレビュー結果、TASK-31追記事項)

## 手順

### 1. 本番Supabaseプロジェクトの新規作成
- リージョン:Tokyo(devと同一。CLAUDE.md/SETUP.mdの前提を踏襲)
- プロジェクト名にdevと区別できる名前を付ける(例:`hagurumado-prod`)

### 2. マイグレーションの適用
`supabase/migrations/`配下の全ファイルを、ファイル名のタイムスタンプ順に適用する
(2026-07-13時点で24ファイル、`20260712000001_enums.sql`〜`20260712000024_production_steps_public.sql`)。
Supabase CLIが使える環境であれば`supabase db push`、使えない場合はSupabase SQL Editorで1ファイルずつ
実行する(devプロジェクト構築時と同じ方法を踏襲する)。

### 3. シードデータの投入(本番用のみ。開発用シードは投入しないこと)
以下の順で適用する:
1. `supabase/seed.sql` — 工程マスタ・設定初期値(本番でも必須)
2. `supabase/seed_products.sql` — 商品マスタ本体
3. `supabase/seed_variations_full.sql` — variations完全版(35商品523種類、TASK-17追記のとおり)。
   適用後、件数照合(523件)を必ず実施する

**`supabase/seed_dev.sql`は本番プロジェクトには絶対に適用しないこと**
(架空の氏名・住所を含む開発確認専用データであり、本番の顧客データと混在させてはならない)。

### 4. 商品マスタの最終調整
- TASK-31作業項目3で確定した国際価格(`price_international`)に更新する
- 公開する商品の`is_active`を`true`に更新する(Fableレビュー結果:公開ゼロのままDNS切替をしないこと)

### 5. BASEデータのインポート(A-16、`/admin/base-import`)
本番Vercelデプロイ(またはローカルで本番プロジェクトのservice_role keyを一時的に指定した環境)から
管理画面の「BASEインポート」ウィザードを使い、TASK-31のリハーサルで使用したものと同じ最新・全期間の
CSV(注文・顧客)を投入する。

- `importBaseOrders()`は`external_ref`(BASE注文ID)で既存注文をスキップする実装のため、
  リハーサル時と同じCSVを本番に対して投入しても(devとprodは別プロジェクトなので)問題なく
  全件が新規投入される
- 同じ手順を誤って複数回実行しても、2回目以降は全件`skipped`になるだけで重複は発生しない
  (受入条件と同じ設計をそのまま利用)

### 6. 取込結果検証
`supabase/verification/base_import_reconciliation.sql`を本番プロジェクトに対して実行し、
全項目がパスすることを確認する(§1件数照合〜§5重複なし確認)。

### 7. 未完了注文の仕分け
`base_import_reconciliation.sql`の §4 で抽出された「要確認」注文について、人間が実際の発送状況を
BASE側の記録・郵便物管理と突き合わせ、実際には未発送のものは管理画面から正しいステータスに修正する
(DB関数/専用API経由。UIから直接UPDATEしない)。

### 8. Vercel環境変数の切替
`docs/vercel-deploy.md` §2の環境変数一覧のうち、Supabase関連(`NEXT_PUBLIC_SUPABASE_URL`・
`NEXT_PUBLIC_SUPABASE_ANON_KEY`・`SUPABASE_SERVICE_ROLE_KEY`)・決済関連(Stripe/PayPalをテストモードから
本番モードへ)・`NEXT_PUBLIC_SITE_URL`(本番ドメイン確定後)を本番用の値に更新し、再デプロイする。
この作業はTASK-34(旧サイト閉鎖・本番切替)と合わせて実施する。

## ロールバック方針
本番プロジェクトへのインポートは新規プロジェクトに対する初回投入のみであり、既存の本番運用データを
上書きするものではない(dev/prodは完全に別プロジェクトのため、本番側で問題が起きてもdevには影響しない)。
万一インポート結果に重大な誤りが見つかった場合は、本番プロジェクトを作り直して再実行することを基本方針とする
(§6の検証を通過するまでは、旧サイト(BASE)の閉鎖・DNS切替(TASK-34)を行わない)。
