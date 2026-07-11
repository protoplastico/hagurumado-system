# TASK-02 DBマイグレーション一式
担当:Sonnet / 依存:TASK-01 / 目安:6h
根拠:docs/db_design.md 全編(**実装前に全文を読む**)

## 作業
1. Supabase CLIセットアップ(supabase init、リンクは手動手順としてREADME記載)
2. マイグレーション作成(分割方針):
   - 001_enums.sql — db_design.md §1の全ENUM
   - 002_products.sql — products/variations/option_groups/option_values/product_option_groups
   - 003_customers_orders.sql — customers/orders/order_items + order_number_counters + 採番関数next_order_number()(YYMMDD-NNN、同時実行安全にUPSERT+RETURNING)
   - 004_production.sql — production_steps/production_batches/batch_step_logs + バッチ番号採番(B+YYMMDD-NN)
   - 005_shipping.sql — shipping_batches/shipments(S+YYMMDD-NN採番)
   - 006_comms_settings.sql — email_logs/custom_order_threads/settings
   - 007_views.sql — customer_stats/production_queue/weekly_throughput/estimated_wait_weeks(§2.7)
   - 008_rls.sql — §4のRLSポリシー(anon読取/顧客自己参照/service_role全権)
3. seed.sql:production_steps 10行(§2.4の表どおり)、settings初期値5件(§2.7)
4. INDEX:db_design.md記載分((production_status, wood_species) 他)

## 注意
- ステータス遷移関数はTASK-03。ここではスキーマのみ
- estimated_wait_weeksの安全マージンは settings から読む設計にし、初期値1.2(乗数)をsettingsに追加してよい(設計書追記事項としてコミットメッセージに明記)

## 受入条件
- [ ] supabase db reset がエラーなく完走(全マイグレーション+シード)
- [ ] 全テーブル・ビュー・ENUMがdb_design.mdと一致(差分があれば報告)
- [ ] next_order_number()連続呼出で 260712-001, -002... が採番される(SQLテスト添付)
