-- TASK-13 A-13: メール種別ごとの自動送信ON/OFF設定。初期値は全種別OFF(承認必須)。
insert into settings (key, value, description) values
  ('auto_send_order_confirm', 'false', '注文確定メールの自動送信(ON時は承認不要で即送信)'),
  ('auto_send_production_start', 'false', '製作開始メールの自動送信(ON時は承認不要で即送信)'),
  ('auto_send_shipped', 'false', '発送完了メールの自動送信(ON時は承認不要で即送信)'),
  ('auto_send_delay', 'false', '遅延通知メールの自動送信(ON時は承認不要で即送信)')
on conflict (key) do nothing;
