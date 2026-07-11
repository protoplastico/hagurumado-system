-- 工程マスタ(db_design.md §2.4 / 要件定義書 §2.2、10ステップ確定)
insert into production_steps (step_no, name_ja, scope, is_custom_extra) values
  (1, '木取り', 'batch', false),
  (2, '穴あけ', 'batch', false),
  (3, '旋盤加工', 'batch', false),
  (4, '整形', 'batch', false),
  (5, '研磨', 'batch', false),
  (6, '塗装', 'batch', false),
  (7, '検品', 'batch', false),
  (8, '箱詰め', 'shipping', false),
  (9, 'ラベリング', 'shipping', false),
  (10, '発送', 'shipping', false);

-- 設定初期値(db_design.md §2.7)
-- wait_estimate_safety_margin はdb_design.mdに明記の無い追加項目。
-- TASK-02の指示(estimated_wait_weeksの安全マージンをsettings由来の乗数とする)に基づき追加。
insert into settings (key, value, description) values
  ('order_stop_threshold_days', '90', '受注自動停止閾値(日)'),
  ('batch_size_default', '20', 'バッチサイズの既定値(本)'),
  ('shipping_batch_size', '6', '発送バッチサイズの既定値(件)'),
  ('weekly_throughput_override', 'null', '週間スループットの手動上書き(通常は実績算出)'),
  ('accepting_orders_global', 'true', '全体受注フラグ'),
  ('wait_estimate_safety_margin', '1.2', '推定待ち週数の安全マージン(乗数、樹種バッチ待ち考慮)');
