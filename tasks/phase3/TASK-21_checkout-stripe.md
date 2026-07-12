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
- [ ] Stripeテストモードで購入→Webhook→paid→queued→メールdraft作成の一連が通る
- [ ] クライアントで価格改ざんしてもサーバー検証で拒否される
- [ ] Webhook二重配信で注文が二重処理されない
- [ ] 受注休止中はチェックアウトAPIが拒否する
