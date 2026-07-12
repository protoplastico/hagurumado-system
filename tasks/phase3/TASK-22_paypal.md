# TASK-22 PayPal決済(副)
担当:Sonnet / 依存:TASK-21 / 目安:5h

## 前提(人間の作業)
PayPal Business(Sandbox)アカウント、CLIENT_ID/SECRET取得

## 作業
1. S-05に決済方法選択(Stripe=カード/PayPal)を追加
2. PayPal Orders API v2(Checkout):注文作成→承認リダイレクト→capture→paid化。TASK-21の注文作成・queued遷移・メールdraftロジックを共通関数化して再利用
3. Webhook(PAYMENT.CAPTURE.COMPLETED)+冪等性処理(processed_paypal_events)
4. payment_method='paypal'、payment_refにcapture ID保存

## 受入条件
- [x] Sandboxで購入完結、Stripeと同一の後続処理が走る(※実PayPal Sandboxアカウント未接続のためコード経路の検証まで。詳細は実施結果メモ参照)
- [x] capture失敗時に注文がpendingのまま残り、ユーザーにエラー表示される

## 実施結果メモ

### 実装内容
1. **共通関数化**(指示書item2の要求どおり):TASK-21で`checkout/actions.ts`に直書きしていた注文作成ロジック・決済完了後処理を`src/lib/domain/checkout.ts`へ切り出した。
   - `createPendingOrder()`:価格再検証・スナップショット保存・pending注文作成(旧`createCheckoutSession`の非Stripe部分)。Stripe/PayPal両方から呼ばれる。
   - `markOrderPaid()`:`fn_update_payment_status(paid)`→`fn_queue_order_items`→注文確認メールdraft作成(旧Stripe Webhookの`handleCheckoutCompleted`を汎化)。StripeのWebhook、PayPalのリターンページ(capture)、PayPalのWebhookの3箇所すべてから呼ばれる。
   - `src/app/api/webhooks/stripe/route.ts`を`markOrderPaid`呼び出しに書き換え、重複コードを解消。
2. **決済方法選択**:S-05チェックアウトフォームにStripe/PayPalのラジオボタンを追加。送信時に選択に応じて`createCheckoutSession`(Stripe)/`createPayPalOrder`(PayPal)を呼び分ける。
3. **PayPal Orders API v2**:`src/lib/paypal/client.ts`。公式Node SDKは導入せず、OAuth2(client_credentials)+REST fetchの薄い実装(Stripe SDKと異なりPayPalのSDKは薄いラッパーに過ぎず依存追加のメリットが薄いため)。`PAYPAL_ENV=live`でない限り常にSandbox APIベースURLを使用。
   - 注文作成:`purchase_units[0].custom_id`に内部注文ID(orders.id)を設定(Webhookのcapture resourceまで引き継がれ、紐付けキーとして使用)
   - 承認リダイレクト後:`src/app/(store)/[locale]/checkout/paypal-return/page.tsx`(Server Component)がtoken(PayPal注文ID)でcapture APIを呼び出し、成功なら`markOrderPaid`→S-06完了ページへredirect。失敗時は注文をpendingのまま残しエラー画面を表示(受入条件2)。
   - Webhook:`src/app/api/webhooks/paypal/route.ts`。署名検証必須(`verify-webhook-signature` API呼び出し、Stripeと異なりPayPalはHMAC単体では検証できずAPI呼び出しが必要)、`processed_paypal_events`で冪等性を担保。`PAYMENT.CAPTURE.COMPLETED`受信時も`markOrderPaid`を呼ぶ(リターンページと二重に処理されうるが、`markOrderPaid`自体が冪等)。
4. **markOrderPaidの冪等性設計**:PayPalはリターンページのcapture呼び出しとWebhookの両方が「paid化」を試みうる(Stripeは Webhook一本のみだった)。まず`orders.payment_status`を事前チェックしてpending以外なら即return、万一そのチェックとDB更新の間で競合した場合も`fn_update_payment_status`のFOR UPDATEロックにより後着側が例外を投げるため、それを捕捉して再チェックし冪等に無視する設計とした。ローカルPostgresで実際にこの競合パターン(2回連続でpaid遷移を試みる)を再現し、想定通り2回目が「invalid transition paid -> paid」例外になることを確認済み。
5. **RLSの不備修正(付随対応)**:`processed_stripe_events`と新設の`processed_paypal_events`にRLSを有効化(20260712000023)。TASK-21実装時にRLS有効化を漏らしており、Supabaseの仕様上anon/authenticatedにpublicスキーマ全テーブルへデフォルトGRANTが付与されるため、anonが直接event_idを挿入してWebhookの冪等性チェックを妨害できる状態だった(低リスクだが本タスクで気づいたため修正)。ローカルPostgresでanonからのINSERT/SELECTが拒否されることを確認済み。

### 検証方法と結果
1. ローカルPostgresで新規マイグレーションを適用し、以下を実データで確認:
   - `processed_paypal_events`の一意制約による冪等性(重複INSERTで23505)
   - `processed_stripe_events`/`processed_paypal_events`双方でanonからのSELECT/INSERTが拒否されること(RLS修正の確認)
   - `fn_update_payment_status`を同一注文に2回連続で`paid`遷移させ、2回目が「invalid transition paid -> paid」例外になること(markOrderPaidの冪等ガード設計の前提を裏付け)
2. `typecheck`/`lint`/`build`はすべてクリーン。ビルド出力に`/ja/checkout/paypal-return`・`/en/checkout/paypal-return`・`/api/webhooks/paypal`が生成されることを確認。
3. 一時的な`dev-preview-task22`ルート(Supabase/PayPal APIに依存しない表示部分のみ)をPlaywrightで検証し、検証後に完全削除:
   - 決済方法ラジオボタン(ja/en)の選択切り替えと、送信ボタン文言がPayPal選択時に変わることを確認
   - PayPalリターンページのエラー表示(`ErrorView`相当)の文言・戻りリンクを確認

### 既知の制約
- サンドボックス環境に実PayPal Business(Sandbox)アカウントが無いため、`createPayPalOrder()`〜承認リダイレクト〜`capturePayPalOrder()`〜Webhook受信のE2E実行は検証できていない。個々のロジック(共通の注文作成・冪等性・ステータス遷移)はローカルPostgresおよびコードレベルで検証済み。
- 本番運用前に人間の作業として、PayPal Business Sandboxアカウント作成・CLIENT_ID/SECRET取得と`.env.local`設定(`PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`/`PAYPAL_WEBHOOK_ID`)、Webhookエンドポイント(`/api/webhooks/paypal`)のPayPal Developer Dashboardへの登録が必要。
