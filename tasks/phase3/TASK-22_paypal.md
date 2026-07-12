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
- [ ] Sandboxで購入完結、Stripeと同一の後続処理が走る
- [ ] capture失敗時に注文がpendingのまま残り、ユーザーにエラー表示される
