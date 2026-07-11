-- db_design.md §2.7: ビュー(customer_stats/production_queue/weekly_throughput/estimated_wait_weeks)

-- 顧客ごとの購入回数/キャンセル回数/最終購入日/累計額
create view customer_stats as
select
  c.id as customer_id,
  count(o.id) filter (where o.payment_status = 'paid') as purchase_count,
  count(o.id) filter (where o.payment_status = 'cancelled') as cancel_count,
  max(o.ordered_at) filter (where o.payment_status = 'paid') as last_purchased_at,
  coalesce(sum(o.total) filter (where o.payment_status = 'paid'), 0) as total_spent
from customers c
left join orders o on o.customer_id = c.id
group by c.id;

-- queued+received のアイテムを ordered_at 順+樹種別滞留数
create view production_queue as
select
  oi.id as order_item_id,
  oi.order_id,
  oi.wood_species,
  oi.production_status,
  o.ordered_at,
  count(*) over (partition by oi.wood_species) as wood_species_backlog_count
from order_items oi
join orders o on o.id = oi.order_id
where oi.production_status in ('received', 'queued')
order by o.ordered_at;

-- 直近4週のbatch_step_logs(検品=step_no 7)から本数/週の移動平均。
-- settings.weekly_throughput_overrideが設定されていればそちらを優先(手動上書き)。
create view weekly_throughput as
select
  coalesce(
    (
      select (s.value #>> '{}')::numeric
      from settings s
      where s.key = 'weekly_throughput_override'
        and s.value is distinct from 'null'::jsonb
    ),
    (
      select coalesce(sum(item_count), 0) / 4.0
      from batch_step_logs
      where step_no = 7
        and completed_at >= now() - interval '28 days'
    )
  ) as items_per_week;

-- 推定待ち週数 = 未完成アイテム総数 ÷ 週間スループット × 安全マージン(settings.wait_estimate_safety_margin)
-- 受注停止判定(fn_check_order_acceptance、TASK-03)とフロント表示に使用。
create view estimated_wait_weeks as
select
  case
    when wt.items_per_week > 0 then
      (
        select count(*)::numeric
        from order_items
        where production_status not in ('shipped', 'completed', 'cancelled')
      )
      / wt.items_per_week
      * (select (value #>> '{}')::numeric from settings where key = 'wait_estimate_safety_margin')
    else null
  end as estimated_wait_weeks
from weekly_throughput wt;
