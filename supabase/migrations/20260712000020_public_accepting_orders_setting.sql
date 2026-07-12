-- TASK-18: S-01トップの受注状態バナー(accepting_orders_global)は匿名ユーザーにも表示するため、
-- settingsテーブルのうち当該キーのみをanonに公開する。他のキー(閾値・バッチサイズ等の内部設定)は
-- 引き続き非公開のまま(service_roleのみ)。estimated_wait_weeksビューは
-- 20260712000008_rls.sqlで既にanon公開済み(フロント用)。

create policy "anon can read accepting_orders_global setting"
  on settings for select
  to anon
  using (key = 'accepting_orders_global');
