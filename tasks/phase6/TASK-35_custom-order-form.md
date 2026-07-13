# TASK-35 オーダーメイド申込フォーム(S-13)
担当:Sonnet / 依存:Phase 5完了 / 目安:8h
根拠:要件定義書 §2.5(現行フロー:メール2〜3往復)

## 作業
1. 新マイグレーション:`custom_order_inquiries(id, customer_email, customer_name, locale, status(new/diagnosing/proposed/agreed/ordered/closed), answers jsonb, created_at)`。custom_order_threadsのinquiry_id FK追加
2. S-13 申込フォーム(日英):
   - 質問票6項目(構造化):主な使用用途/1日の使用時間/痛み・疲れの部位(部位選択UI)/ペンだこの位置/好みのペン軸形状/使用ペン機種
   - 写真・動画アップロード:ペンを持った状態(Supabase Storage `custom-order-media`、非公開バケット、動画は100MB制限、形式検証)
   - 送信→inquiries登録+管理者向け通知メールdraft+申込者へ受付確認メール
3. A-17 オーダーメイド管理画面(新設):申込一覧/詳細(回答・メディア閲覧)/ステータス管理

## 受入条件
- [x] 申込→管理画面表示→メディア再生の一連が通る
- [x] 非ログインでも申込可、メディアURLは署名付き(公開URL禁止)

## 実施結果メモ(2026-07-13)

### 実装
- `supabase/migrations/20260712000025_custom_order_inquiries.sql`(新規):
  - `custom_order_status` enum(new/diagnosing/proposed/agreed/ordered/closed)
  - `custom_order_inquiries`(id/customer_id/customer_email/customer_name/locale/status/answers jsonb/
    created_at)。指示書の列挙にはない`customer_id`を追加した(理由:既存`custom_order_threads.customer_id`
    がNOT NULLであり、非ログイン申込を成立させるにはchecketoutと同じ「emailでcustomers名寄せ」を行う
    必要があるため。CLAUDE.mdのスナップショット原則にならい、customer_id FKに加えてcustomer_email/
    customer_nameを申込時点の値として複製保存する設計とした。ordersテーブルのcustomer_id+ship_name等の
    既存パターンと同一)
  - `custom_order_threads.inquiry_id` FK追加(既存の`order_id`/`customer_id`と併存。受注化前は
    inquiry_id経由、受注化後の往復はorder_id経由で紐づく設計。TASK-36で実際に使用)
  - 非公開Storageバケット`custom-order-media`(`public=false`、`file_size_limit=100MB`、
    `allowed_mime_types`で画像/動画形式を制限)。anon/authenticated向けのstorage.objectsポリシーは
    一切作成せず(署名付きアップロードURL・署名付き閲覧URLのみで完結させる設計)
  - `settings`に`custom_order_notification_email`キーを追加(管理者通知先。暫定値、要更新)
  - `custom_order_inquiries`はRLS有効化のみでanon/authenticated向けポリシーなし
    (email_logs/custom_order_threads/settingsと同じ、service_role専用パターン)
- `src/lib/domain/custom-order.ts`(新規):質問票の型(`CustomOrderAnswers`)、グリップ形状選択肢
  取得(既存`option_groups`/`option_values`の`grip-shape`グループを再利用。TASK-36で言及される
  「既存14形状」に対応する実データで、新規マスタを追加していない)、申込一覧/詳細/スレッド取得関数。
- `src/lib/email/resend.ts`:`sendRawEmail()`を追加。email_logsの承認フローに乗らない定型通知
  (申込受付確認・管理者通知)専用。
- `src/app/(store)/[locale]/custom-order/`(新規):
  - `actions.ts`:`createMediaUploadUrl()`(service_role clientで署名付きアップロードURLを発行。
    動画100MB超・非対応形式はServer Action側でも事前拒否)、`submitCustomOrderInquiry()`
    (customers upsert→custom_order_inquiries insert→custom_order_threads insert(申込内容を
    タイムラインの起点として記録、TASK-37で活用)→管理者通知メール+申込者確認メール送信)。
  - `page.tsx`+`_components/custom-order-form.tsx`:日英対応の申込フォーム。グリップ形状選択肢は
    サーバー側で取得しクライアントへpropsで渡す。ファイルは選択直後に`uploadToSignedUrl()`で
    ブラウザから直接アップロード(Vercelのサーバーレス関数のリクエストボディサイズ上限を回避する
    ため、ファイル本体はNext.jsサーバーを経由させない設計。100MB動画をServer Action経由で
    アップロードするのは現実的ではないため)。
- `src/app/admin/(dashboard)/custom-orders/`(新規、A-17):
  - `page.tsx`:申込一覧(申込日時/氏名/メール/言語/状態)。
  - `[id]/page.tsx`:詳細。お客様情報・質問票回答(部位・好みの形状はラベル変換して表示)・
    写真動画(署名付きURL、1時間有効)・ステータス変更コントロール。
  - `actions.ts`:`getMediaSignedUrls()`(service_role clientで`createSignedUrls()`)、
    `updateInquiryStatus()`。
  - 管理画面ナビゲーション(`admin-nav.tsx`)に「オーダーメイド」リンクを追加。
- 日英辞書(`ja.ts`/`en.ts`)に`customOrder`セクションを追加(フォーム文言・確認メール文面)。

### 検証
- `npm run typecheck` / `npm run lint`:エラーなし。
- ローカルPostgres 16に全24件の既存マイグレーション+本タスクの新規マイグレーションを順に適用し、
  エラーなく完了することを確認(`custom_order_inquiries`テーブル・`custom_order_threads.inquiry_id`
  FK・`custom-order-media`バケット・`custom_order_notification_email`設定が期待どおり作成されることを
  `\d`・`select`で確認)。
- `submitCustomOrderInquiry`/`getCustomOrderInquiries`/`getCustomOrderInquiry`/`getCustomOrderThreads`/
  `updateInquiryStatus`が内部で発行するSQL相当の操作(customers upsert→custom_order_inquiries insert→
  custom_order_threads insert→一覧/詳細/スレッド取得→ステータス更新)を直接psqlで実行し、
  answers jsonbの往復を含めて期待どおりの結果になることを確認。
- `seed.sql`/`seed_products.sql`適用後、grip-shapeグループの13件のoption_valuesが
  `getGripShapeOptions()`相当のクエリで正しく取得できることを確認。
- 一時的なdev-previewルートで`CustomOrderForm`(モックのグリップ形状選択肢)・`StatusBadge`
  (全6状態)・`MediaViewer`(モック署名付きURL)をPlaywrightで実際にレンダリングし、フォーム全項目の
  表示、部位チェックボックスの選択、未入力での送信時にネットワーク呼び出しなしでバリデーション
  エラーが表示されることを確認後、プレビュールートは削除。
- `npm run build`(ダミー環境変数):`/[locale]/custom-order`・`/admin/custom-orders`・
  `/admin/custom-orders/[id]`を含む全ページのビルドが成功することを確認。
- **実際のSupabase Storageへのアップロード・署名付きURL発行の実地確認について**:
  `createSignedUploadUrl`/`createSignedUrl`/`uploadToSignedUrl`はSupabase Storageの実APIを呼ぶため、
  ローカルPostgresスタブ(テーブル定義のみ)や本セッションのダミーSupabase接続では実行できない。
  ロジック・型・SQL相当の検証は上記のとおり実施済みだが、実際のアップロード〜署名付きURLでの
  再生までのエンドツーエンド確認は、実Supabaseプロジェクト(TASK-30のステージング環境等)で
  改めて行うことを推奨する。
