-- TASK-06 A-05: 生産キュー画面表示に必要な列をproduction_queueビューに追加
-- (注文番号/機種/仕様要約用データ/オーダーメイド区別)。既存列は変更せず末尾に追加のみのため、
-- 既存のGRANT/REVOKE(008_rls.sql)はそのまま有効。

-- PostgreSQLのCREATE OR REPLACE VIEWは既存列の途中挿入・改名を許可しないため、
-- 既存6列の順序はそのまま維持し、新規列は末尾に追加する。
create or replace view production_queue as
select
  oi.id as order_item_id,
  oi.order_id,
  oi.wood_species,
  oi.production_status,
  o.ordered_at,
  count(*) over (partition by oi.wood_species) as wood_species_backlog_count,
  o.order_number,
  oi.product_name,
  oi.variation_name,
  oi.maker,
  oi.options_snapshot,
  oi.custom_note,
  oi.is_custom_order
from order_items oi
join orders o on o.id = oi.order_id
where oi.production_status in ('received', 'queued')
order by o.ordered_at;
