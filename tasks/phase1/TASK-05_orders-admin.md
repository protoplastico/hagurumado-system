# TASK-05 注文管理(一覧・詳細)
担当:Sonnet / 依存:TASK-04 / 目安:8h
根拠:screen_design.md A-03, A-04 / db_design.md orders, order_items

## 作業
1. A-03 注文一覧:検索(注文番号/顧客名)、フィルタ(payment_status/production_status/樹種/maker/region/source/期間)、ページネーション。タブレットでカード式に切替(md未満)
2. A-04 注文詳細:
   - ヘッダ:注文番号/決済ステータス/日時/合計
   - 明細:各order_itemの仕様スナップショット展開(options_snapshot全表示)+個別のproduction_status
   - 配送先・顧客メッセージ・要望・希望日
   - admin_memo編集(自動保存)
   - 決済ステータス手動変更(refund/cancelledは確認モーダル。cancelled時は所属アイテムも連動cancelled — fn経由)
3. テスト用シード:サンプル注文10件(多様な樹種/オプション/国内外)を`supabase/seed_dev.sql`に作成(**架空データのみ。実在人名・住所禁止**)

## 受入条件
- [ ] フィルタ組合せが正しく動作
- [ ] 明細にスナップショットが表示される(products JOINに依存していないこと)
- [ ] キャンセル時にorder_itemsが連動する
