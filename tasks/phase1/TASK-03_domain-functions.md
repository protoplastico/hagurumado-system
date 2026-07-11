# TASK-03 ステータス遷移・ドメイン関数
担当:Sonnet / 依存:TASK-02 / 目安:5h
根拠:db_design.md §3(遷移図)、要件定義書 §2.3〜2.4

## 作業
PostgreSQL関数(SECURITY DEFINER)として実装:
1. fn_create_batch(wood_species, item_ids[]) — queuedアイテム検証→バッチ作成→item.batch_id設定→status=in_batch
2. fn_advance_batch_step(batch_id) — current_step+1、batch_step_logsへ記録(item_count含む)。工程7完了時:バッチcompleted+所属アイテム一括inspected
3. fn_return_item_to_queue(item_id, reason) — 差戻し:バッチから除外→queued、admin_memoに理由追記
4. fn_create_shipping_batch(order_ids[]) — 全アイテムinspected検証→shipments作成→ready_to_ship
5. fn_mark_shipped(shipment_id, carrier, tracking_number) — shipped遷移+shipped_at
6. fn_check_order_acceptance() — estimated_wait_weeks×7 > settings.order_stop_threshold_days なら accepting_orders_global=false、下回れば true。戻り値で変化有無を返す(メール通知トリガーはPhase 2)
7. 不正遷移は全て EXCEPTION で拒否(遷移可否のマトリクスをコメントで明記)

TypeScript側:`src/lib/domain/` に上記RPCの型付きラッパー+production_statusの表示名マップ(screen_design.md §5の対応表)

## 受入条件
- [ ] pgTAPまたはSQLスクリプトで正常系・不正遷移拒否のテストが通る
- [ ] 差戻し後のアイテムがproduction_queueビューに再出現する
