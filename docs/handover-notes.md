# 申し送り事項(Phase 1〜6 実装完了時点)

作成日:2026-07-13
対象:TASK-01〜TASK-37(全6フェーズ)完了時点でのパッケージ化にあたり、
構築を引き継ぐ担当者(工房スタッフ・開発者)向けにまとめた不具合予備軍・未検証事項・
人間の判断/作業待ちの事項の一覧。

**結論から言うと、コードは全タスクの受入条件を満たす形で実装・ローカル検証済みだが、
実際のSupabase/Stripe/PayPal/Sanity/Vercel/GA4等の実環境・実キーが本開発セッションには
一度も存在しなかったため、「本番相当の環境での実地動作確認」は一つも行われていない。**
本番投入前に必ずステージング環境での通し確認を行うこと。

---

## 1. 最優先で人間が決めるべき事項(要件定義書 残課題)

### 1-1. オーダーメイド追加工程の正式名称・配置(残課題#1)
- 現状:`production_steps`テーブルに`step_no=11,12`として
  「オーダーメイド追加工程1(仮称・要ヒアリング確定)」「オーダーメイド追加工程2(仮称・要ヒアリング確定)」
  という**仮の名前**で登録済み(`supabase/migrations/20260712000026_custom_order_extra_steps.sql`)。
- 要件定義書は本来「工程3〜5の間」への挿入を想定しているが、実装では**既存の標準工程1〜7の番号は
  一切変更せず、工程7より後(11,12)に非破壊的に追加**する設計にした。理由:
  - 工程名・工程数とも人間へのヒアリングで未確定な段階で、`weekly_throughput`ビュー・
    `fn_advance_batch_step`関数・`kanban-board.tsx`のハードコード箇所を全て番号繰り上げに
    合わせて改修するのは、確定していない仕様に対してリスクが高い変更になる。
  - 標準バッチ(オーダーメイドでない通常注文)の完了挙動には一切影響を与えない設計にできる。
- **必要なアクション**:実際の工程名・工程数、および「工程3〜5の間」配置が業務上どうしても
  必要かどうかを職人へのヒアリングで確定させ、必要であれば別途リナンバリング用マイグレーションを
  作成する(`fn_advance_batch_step`はテーブル参照型に書き換え済みなので、`production_steps`の
  行を差し替えるだけで対応できるはずだが、`step_no`の並び順を変える場合は
  `weekly_throughput`ビュー(`step_no=7`をハードコード参照)の追随修正が必要)。

### 1-2. BASE注文/顧客CSVの実カラム(残課題#2)
- `src/lib/domain/base-import.ts`・`supabase/verification/base_import_reconciliation.sql`は
  BASEの一般的なエクスポート形式を前提に実装したが、**実際のCSVエクスポートファイルは一度も
  本セッションに提供されていない**。
- **必要なアクション**:実際にBASE管理画面からエクスポートし、カラム名・エンコーディング・
  日付形式等がインポートスクリプトの前提と一致するか確認。ズレがあれば`base-import.ts`側の
  マッピングを調整。

### 1-3. 注文番号形式(残課題#3)
- 現状の実装は連番形式(`next_order_number()`)。日付+連番形式への変更要否は未確定のまま。

---

## 2. 実環境での動作確認が一度も行われていない機能(重要度:高)

以下は**ロジック・型・SQLレベルではローカルPostgres/コードレビューで検証済み**だが、
実サービスとの通信を伴うため、本セッションのサンドボックス環境(実キーなし)では
エンドツーエンドの実地確認ができなかった。ステージング環境構築後、最優先で確認すること。

| 機能 | 該当タスク | 未検証の内容 |
|---|---|---|
| Stripe決済(通常注文) | TASK-21 | `createCheckoutSession()`〜Checkout Session発行〜決済〜Webhook受信の一連 |
| PayPal決済 | TASK-22 | `createPayPalOrder()`〜承認リダイレクト〜`capturePayPalOrder()`〜Webhook受信の一連 |
| Stripe Payment Link(オーダーメイド受注化) | TASK-36 | Payment Link発行・metadata伝播・決済完了Webhookの一連 |
| カート再計算 | TASK-20 | `recalculateCart()`のServer Action経由の実行、locale切替時の価格追従の実機確認 |
| 会員登録・ログイン | TASK-23 | `signUp()`→確認メール→`callback`到達→自動リンクの一連、マイページの実データ表示 |
| Sanity CMS連携 | TASK-25, 27 | Studio編集→Publish→フロント反映(ISR/Webhook経由)の実機確認、`sanity deploy`自体が未実施 |
| Supabase Storage署名付きURL | TASK-35 | `createSignedUploadUrl`/`uploadToSignedUrl`による実アップロード〜再生の一連(100MB動画含む) |
| Claude Vision API(AI診断) | TASK-36 | 実際のAI応答内容(JSON構造の妥当性、所見の質)の確認 |
| GA4計測 | TASK-29 | DebugViewでの実イベント受信確認 |
| Lighthouseパフォーマンス実測 | TASK-26, 29 | 実ホスティング環境での再計測(ビルド出力からの机上推定のみ実施) |
| オーダーメイドのフルサイクル | TASK-37 | 申込→診断→提案→受注→Stripe決済→追加工程付きバッチ生産→検品完了→発送の通し確認 |

---

## 3. 人間が実施すべき作業(コード側の対応は完了済み)

### デプロイ・環境構築(TASK-30, 33)
- Vercelプロジェクトの実際の作成・GitHub連携・環境変数登録・デプロイ実行
- Stripe/PayPal/Sanityの本番Webhookエンドポイント登録(ステージングURL確定後)
- Stripe/PayPal本番キーの発行・Vercel本番環境変数への設定
- Resendでのドメイン認証(SPF/DKIM/DMARC)
- 実際のDNS切替・SSL証明書発行確認、`shop.hagurumado.com`のCNAME切替
- 公開後即時検証(本番決済テスト・返金、メール送達確認等)
- 参照:`docs/vercel-deploy.md`、`docs/production-launch-runbook.md`

### データ移行(TASK-31, 33)
- devプロジェクトへの実際のBASE全期間データ取込、`base_import_reconciliation.sql`の実行
- 未完了注文の仕分け(実データに基づく人間の確認、「便宜的に発送済」判定の要確認注文含む)
- 国際価格の確定、**現在全商品`is_active=false`**のため公開する商品のis_active化
  (公開ゼロのままDNS切替をしないこと)
- 旧WordPressサイトの全ファイル・DBバックアップ取得、実際のURL一覧洗い出しと
  `next.config.mjs`の`redirects()`への追記(現状は`/shop`→`/ja/products`の1件のみ実装済み)
- 参照:`docs/production_migration_guide.md`、`docs/migration_rehearsal_report.md`(記入待ちテンプレート)

### BASE閉店作業(TASK-34)
- 各プラットフォームでの実際の告知掲示・受付停止・解約手続き
- `pre_closure_check.sql`の実データでの実行、顧客への移行案内メール送信判断
- 各プラットフォームの最終CSVエクスポート取得・二重保管
- 参照:`docs/base_closure_checklist.md`、`docs/closure-announcements.md`、`docs/migration_complete.md`(記入待ち)

### E2Eテスト実施(TASK-32)
- ステージングURLでの`docs/e2e_checklist.md`全項目の手動実施
- `npm run test:e2e`のステージング環境での実行(`PLAYWRIGHT_BASE_URL`・
  `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`を設定)。特にStripeホスト型Checkoutページの
  フィールド構成は変わりやすいため、初回実行時にセレクタ調整が必要になる可能性が高い
- 発見した不具合は`docs/e2e_issues.md`に記録

---

## 4. インフラ上の前提条件(見落としやすい設定)

- **pg_cron拡張**:受注自動制御(90日超待ちで自動停止)・pending注文タイムアウト処理は
  `supabase/migrations/20260712000017_order_acceptance_cron.sql`・
  `20260712000022_shipping_stripe_checkout.sql`内でSupabase Postgresの`pg_cron`拡張を用いて
  実装している。本番Supabaseプロジェクトで`pg_cron`拡張が有効化されていないとこれらの
  マイグレーションが失敗する。ローカル検証では`pg_cron`が使えないため、該当セクションは
  スタブ環境でスキップして検証した(コード自体は本番Supabase前提で書かれている)。
- Vercel Cronへの移設は意図的に行っていない(pg_cronがPostgres内で完結するため、
  外部HTTP経由にすると余分なホップが増えるだけで利点がない、という設計判断。詳細は
  `docs/vercel-deploy.md`参照)。

---

## 5. 設計上の注意点(バグではないが、引き継ぎ時に誤解しやすい箇所)

- **決済状態と生産状態は独立**(`orders.payment_status` / `order_items.production_status`)。
  管理画面や新機能を追加する際、この2つを混同して1つのステータスにまとめないこと
  (CLAUDE.md絶対規則)。
- **物理1本=1行**:`order_items`はグリップ1本につき1レコード。数量集計をする際に
  「注文1件=1行」という前提で実装しないこと。
- **スナップショット原則**:注文・オーダーメイド申込の明細は当時の商品名・仕様・単価を
  複製保存している。表示時にマスタテーブルを都度JOINして最新値を出す実装に変更しないこと
  (価格改定後も過去注文の表示が変わらないようにするための設計)。
- **ステータス遷移はDB関数経由のみ**:`fn_advance_batch_step`等のSECURITY DEFINER関数を
  介さずにUIから`order_items`/`production_batches`等を直接UPDATEしないこと。
- フロントの商品取得等の一部クエリは、Supabase接続失敗時に`.catch()`でフォールバックしない
  意図的な設計になっている(TASK-28で確認・踏襲)。実データ環境がないと例外が伝播して
  ページがハングしたように見えることがあるが、これは実装漏れではなく設計方針。

---

## 6. まだ着手していない領域(要件定義書で明示的にスコープ外)

- オーダーメイドAIチャット(現状はフォーム+メール往復)
- 配送業者API連携(現状は手動記録)
- 複数管理者ロール(現状は1アカウント共有)
- 原材料在庫管理(受注可否フラグで代替)

---

## 7. 参照ドキュメント一覧

| ドキュメント | 内容 |
|---|---|
| `docs/hagurumado_requirements.md` | 要件定義書(第8部に確定事項・残課題) |
| `docs/db_design.md` | DB設計書 |
| `docs/screen_design.md` | 画面設計書 |
| `docs/vercel-deploy.md` | Vercelデプロイ手順・環境変数一覧 |
| `docs/production_migration_guide.md` | 本番データ移行手順(8ステップ) |
| `docs/migration_rehearsal_report.md` | 移行リハーサル結果記録用(未記入) |
| `docs/production-launch-runbook.md` | 本番公開ランブック |
| `docs/base_closure_checklist.md` | BASE閉店チェックリスト |
| `docs/closure-announcements.md` | 閉店告知文案 |
| `docs/migration_complete.md` | 移行完了報告テンプレート(未記入) |
| `docs/e2e_checklist.md` / `docs/e2e_issues.md` | E2E手動確認項目・不具合記録 |
| `tasks/phase*/TASK-*.md` | 各タスクの作業内容・実施結果メモ(タスクごとの詳細な検証記録・未実施事項) |

各タスクファイル末尾の「実施結果メモ」に、そのタスク固有のより詳細な検証内容・制約事項が
記載されているため、特定機能を触る前に該当タスクファイルを参照することを推奨する。
