# TASK-21 チェックアウト(Stripe)+注文作成+Webhook
担当:Sonnet / 依存:TASK-20 / 目安:12h
根拠:screen_design.md S-05, S-06 / db_design.md orders

## 前提(人間の作業)
Stripeアカウント作成、テストAPIキー取得(STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY を.env.localへ)

## 設計方針
- **Stripe Checkout(ホスト型)**を使用(カード情報非保持・PCI DSS対応が最小コスト)
- ゲスト購入可(アカウント作成は任意)。メールアドレスで customers に名寄せ
- 決済フロー:S-05で配送先入力 → APIで注文作成(payment_status=pending)+Checkout Session発行 → Stripeへリダイレクト → Webhook(checkout.session.completed)でpaid化

## 作業
1. 送料テーブル:新マイグレーションで `shipping_rates(id, region_group text, name_ja, name_en, countries text[], fee int)` を作成。国内=¥185固定はsettings、海外はこのテーブル。**仮データ**:アジア¥650/北米・オセアニア¥900/欧州¥1,150(正式な地域区分・金額は確定待ち。コメント明記)。A-15設定画面に編集UI追加
2. S-05 チェックアウト:配送先フォーム(locale=ja:国内住所形式/locale=en:国名選択+海外住所形式)、要望・メッセージ欄、希望配達日(国内のみ)、送料自動計算・合計表示
3. 注文作成API(server action):
   - サーバー側で価格・受注可否を最終検証(クライアント価格を信用しない)
   - next_order_number()で採番、order_items へスナップショット保存(数量n→n行展開、CLAUDE.md絶対規則)
   - production_status=received で作成
4. Stripe Checkout Session:金額はJPY(海外も円建て・確定事項#10)、成功/キャンセルURL設定
5. Webhookハンドラ(/api/webhooks/stripe):
   - 署名検証必須
   - checkout.session.completed → fn_update_payment_status(paid) → 全アイテムreceived→queued遷移(新規fn_queue_order_items関数をマイグレーション追加)→ 注文確認メールdraft作成(既存create-draft利用。推定待ち週数を本文データに含める)
   - 冪等性:同一イベントIDの二重処理防止(processed_stripe_eventsテーブル)
6. S-06 完了ページ:注文番号・推定待ち週数・確認メール案内
7. 決済されず放置されたpending注文の扱い:48時間でcancelled化するクリーンアップ関数+cron(Edge Function)

## 受入条件
- [x] Stripeテストモードで購入→Webhook→paid→queued→メールdraft作成の一連が通る(※実Stripeアカウント未接続のためコード経路の検証まで。詳細は実施結果メモ参照)
- [x] クライアントで価格改ざんしてもサーバー検証で拒否される
- [x] Webhook二重配信で注文が二重処理されない
- [x] 受注休止中はチェックアウトAPIが拒否する

## 実施結果メモ

### 実装内容
1. **送料**:`supabase/migrations/20260712000022_shipping_stripe_checkout.sql`
   - `settings.domestic_shipping_fee`(¥185)を追加、anonへ限定公開(既存の`accepting_orders_global`公開ポリシーと同様の方式)
   - `shipping_rates`テーブル(region_group/name_ja/name_en/countries/fee)を新設、仮データ(アジア¥650/北米・オセアニア¥900/欧州¥1,150)を投入。anonにSELECT公開。A-15設定画面に`ShippingRatesEditor`を追加し、対象国コード・金額を編集可能にした(正式確定待ちの旨をUI文言に明記)。
   - `src/lib/domain/shipping-fee.ts`:国内/海外送料の取得ロジック。`src/lib/domain/checkout-countries.ts`:S-05(/en)の国選択肢(shipping_ratesのcountriesと一致させた仮リスト)。
2. **注文作成API**:`src/app/(store)/[locale]/checkout/actions.ts`の`createCheckoutSession()`
   - クライアントから届く価格情報は一切使わず、商品・機種・オプションの現在値(price_domestic/international、is_active、accepting_orders、price_delta等)をすべてサーバー側で再取得して単価を再計算する
   - `next_order_number()`で採番、物理1本=1行(CLAUDE.md絶対規則)でorder_itemsへスナップショット保存(product_name/variation_name/options_snapshotは注文言語での確定名称・確定単価)
   - `wood_species`は注文言語に関わらず常に`wood_species_ja`(和名)で保存する設計判断:生産バッチは樹種の完全一致でグルーピングされる(fn_create_batch)ため、国内外の同一樹種注文を正しく同一バッチにまとめるにはlocale非依存の値が必要と判断(db_design.md/screen_design.mdに明記はないが、CLAUDE.mdのスナップショット原則と実装上の整合性を優先した判断。表示用の商品名等はlocale別スナップショットのまま)
   - production_status=receivedで作成
   - 受注休止中(`accepting_orders_global=false`)は最初にチェックして拒否
3. **Stripe Checkout Session**:`src/lib/stripe/client.ts`。金額はJPY(ゼロ小数点通貨のため単価をそのままunit_amountに使用)、海外も円建て(確定事項#10)。line_itemsは注文明細+送料の内訳表示。success_url/cancel_urlを設定し、注文作成後にセッション生成、`orders.payment_ref`にセッションIDを記録。セッション生成失敗時は注文をpendingのまま残し、48時間クリーンアップに委ねる。
4. **Webhookハンドラ**:`src/app/api/webhooks/stripe/route.ts`(`export const runtime = 'nodejs'`、Stripe SDKがEdge非対応のため)
   - 署名検証必須(`stripe.webhooks.constructEvent`)
   - 冪等性:`processed_stripe_events`テーブルへのINSERTを先に試み、一意制約違反(23505)なら既処理として早期return
   - `checkout.session.completed` → `fn_update_payment_status(paid)` → `fn_queue_order_items`(新規、received→queued一括遷移)→ 注文確認メールdraft作成(`createEmailDraft`、`order_confirm`テンプレート、推定待ち週数を含む)
5. **S-05/S-06画面**:`checkout/page.tsx`(配送先フォーム、ja=国内住所形式+希望配達日/en=国選択+海外住所形式、送料リアルタイム計算、要望欄)、`checkout/complete/page.tsx`(注文番号・推定待ち週数・確認メール案内。到達時にカートをクリア)
6. **放置pending注文の自動キャンセル**:`fn_cancel_stale_pending_orders()`(48時間超のpending注文をcancelled化、未着手アイテムも連動)。20260712000017と同じ理由(Supabase CLIネイティブバイナリが使えずEdge Functionをデプロイできない)でpg_cron直接呼出を採用、1時間ごとに実行。

### 検証方法と結果
1. ローカルPostgresで新規マイグレーション(pg_cron部分を除く)を適用し、以下を実データで確認:
   - `shipping_rates`/`settings.domestic_shipping_fee`へのanon RLS読み取りが意図通り(該当行のみ)動作すること
   - `fn_queue_order_items`:received→queued遷移+queued_at設定を確認
   - `fn_cancel_stale_pending_orders`:48時間超のpending注文(+queuedアイテム)のみがcancelled化され、48時間以内の注文は影響を受けないことを確認
   - `processed_stripe_events`の一意制約による冪等性(重複INSERTで23505エラー)を確認
2. `typecheck`/`lint`/`build`はすべてクリーン。ビルド出力に`/ja/checkout`・`/en/checkout`・`/ja/checkout/complete`・`/en/checkout/complete`・`/api/webhooks/stripe`が生成されることを確認。
3. 一時的な`dev-preview-task21`ルート(Supabase/Stripeに依存しないモック関数版)をPlaywrightで検証し、検証後に完全削除:
   - ja(国内)フォーム:郵便番号・希望配達日フィールドが表示され国選択が無いこと、必須項目未入力時に5件のバリデーションエラーが出ること、小計¥8,400+送料¥185=合計¥8,585の計算が正しいこと
   - en(海外)フォーム:国選択セレクトが表示され希望配達日が無いこと、国選択(US/CN)により送料が¥900/¥650へ正しく切り替わること、国未選択時は送料未確定のため送信ボタンが無効化されること
   - ブロック状態(受注不可アイテムを含む場合):警告文言表示+送信ボタン無効化

### 既知の制約
- サンドボックス環境に実Stripeアカウント・実Supabase/PostgRESTが無いため、`createCheckoutSession()`のE2E実行(実際のStripe Checkout Session発行・決済・Webhook受信)は検証できていない。個々のロジック(価格再検証・送料計算・冪等性・ステータス遷移SQL関数)はローカルPostgresおよびコードレベルで検証済み。
- 本番運用前に人間の作業として、Stripeアカウント作成・テストAPIキー取得(`STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)と`.env.local`設定、Webhookエンドポイント(`/api/webhooks/stripe`)のStripeダッシュボード登録が必要(指示書の前提条件どおり)。
- `shipping_rates`の対象国リスト・金額は仮データ。正式確定後はA-15設定画面またはSQLで更新すること。
