-- db_design.md §4: Row Level Security
-- service_role(管理画面・API)はSupabase側でRLSを常にバイパスするため明示ポリシー不要。

alter table products enable row level security;
alter table variations enable row level security;
alter table option_groups enable row level security;
alter table option_values enable row level security;
alter table product_option_groups enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table production_steps enable row level security;
alter table production_batches enable row level security;
alter table batch_step_logs enable row level security;
alter table shipping_batches enable row level security;
alter table shipments enable row level security;
alter table email_logs enable row level security;
alter table custom_order_threads enable row level security;
alter table settings enable row level security;

-- anon: products/variations/options の読取(is_active=trueのみ)
create policy "anon can read active products"
  on products for select
  to anon
  using (is_active = true);

create policy "anon can read variations of active products"
  on variations for select
  to anon
  using (
    exists (
      select 1 from products p
      where p.id = variations.product_id and p.is_active = true
    )
  );

create policy "anon can read active option_groups"
  on option_groups for select
  to anon
  using (is_active = true);

create policy "anon can read active option_values"
  on option_values for select
  to anon
  using (is_active = true);

create policy "anon can read product_option_groups of active products"
  on product_option_groups for select
  to anon
  using (
    exists (
      select 1 from products p
      where p.id = product_option_groups.product_id and p.is_active = true
    )
  );

-- authenticated(顧客): 自分の customers/orders/order_items/shipments を読取のみ
create policy "customers can read own customer row"
  on customers for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "customers can read own orders"
  on orders for select
  to authenticated
  using (
    customer_id in (select id from customers where auth_user_id = auth.uid())
  );

create policy "customers can read own order_items"
  on order_items for select
  to authenticated
  using (
    order_id in (
      select o.id from orders o
      join customers c on c.id = o.customer_id
      where c.auth_user_id = auth.uid()
    )
  );

create policy "customers can read own shipments"
  on shipments for select
  to authenticated
  using (
    order_id in (
      select o.id from orders o
      join customers c on c.id = o.customer_id
      where c.auth_user_id = auth.uid()
    )
  );

-- ビューはPostgresのデフォルトではowner権限で実行されRLSをバイパスするため、
-- 権限の網羅性はGRANT/REVOKEで直接制御する。
-- estimated_wait_weeks(推定待ち週数)はanonにも公開(受注停止表示・フロント用)。
-- customer_stats/production_queue/weekly_throughputは管理画面(service_role)専用。
revoke select on customer_stats from anon, authenticated;
revoke select on production_queue from anon, authenticated;
revoke select on weekly_throughput from anon, authenticated;
grant select on estimated_wait_weeks to anon, authenticated;
