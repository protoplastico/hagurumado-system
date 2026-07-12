-- TASK-21: 送料テーブル・Stripeチェックアウト連携用テーブル/関数
-- 送料:国内(¥185固定・クリックポスト)はsettingsに追加、海外はregion_group単位のshipping_ratesテーブル。
-- 仮データ:アジア¥650/北米・オセアニア¥900/欧州¥1,150
-- (正式な地域区分・金額は確定待ち。A-15設定画面で編集可能にしてあるため、確定後はそちらから更新すること)。

insert into settings (key, value, description) values
  ('domestic_shipping_fee', '185', '国内送料(円、クリックポスト固定)');

-- S-05チェックアウトの送料表示用にanonへ公開(他の内部設定キーは非公開のまま)。
create policy "anon can read domestic_shipping_fee setting"
  on settings for select
  to anon
  using (key = 'domestic_shipping_fee');

create table shipping_rates (
  id uuid primary key default gen_random_uuid(),
  region_group text unique not null,
  name_ja text not null,
  name_en text not null,
  countries text[] not null,
  fee integer not null
);

alter table shipping_rates enable row level security;

-- S-05チェックアウトの送料自動計算用(金額のみ、機微情報を含まないため全件公開)。
create policy "anon can read shipping_rates"
  on shipping_rates for select
  to anon
  using (true);

-- 仮データ。国コードはISO 3166-1 alpha-2。正式な地域区分・金額は確定待ち(TASK-21指示書)。
insert into shipping_rates (region_group, name_ja, name_en, countries, fee) values
  ('asia', 'アジア', 'Asia', array['CN','KR','TW','HK','SG','TH','VN','PH','MY','ID'], 650),
  ('na_oceania', '北米・オセアニア', 'North America / Oceania', array['US','CA','AU','NZ'], 900),
  ('europe', '欧州', 'Europe', array['GB','FR','DE','IT','ES','NL','SE','CH'], 1150);

-- Stripe Webhookイベントの冪等性担保(同一event_idの二重処理防止)
create table processed_stripe_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

-- 決済完了後:注文内のreceivedアイテムを一括queuedへ遷移する
-- (db_design.md §3で「TASK-05領域、単純なキュー登録操作」として保留されていた分をTASK-21で実装)。
create function fn_queue_order_items(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update order_items
  set production_status = 'queued',
      queued_at = now()
  where order_id = p_order_id
    and production_status = 'received';
end;
$$;

-- 48時間以上pendingのまま放置された注文をcancelled化。fn_update_payment_status(pending→cancelled)と
-- 同じ遷移ルール(未着手のreceived/queued/in_batchアイテムのみ連動キャンセル)を対象注文にまとめて適用する。
create function fn_cancel_stale_pending_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_count integer := 0;
begin
  for v_order_id in
    select id from orders
    where payment_status = 'pending'
      and ordered_at < now() - interval '48 hours'
  loop
    update orders set payment_status = 'cancelled' where id = v_order_id;

    update order_items
    set production_status = 'cancelled'
    where order_id = v_order_id
      and production_status in ('received', 'queued', 'in_batch');

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- 20260712000017と同じ理由(Supabase CLIネイティブバイナリが使えずEdge Functionをデプロイできないため)
-- でpg_cron直接呼出を採用。1時間ごとに放置pending注文をチェックする。
create extension if not exists pg_cron;

select cron.schedule(
  'cancel-stale-pending-orders-hourly',
  '0 * * * *',
  $$select fn_cancel_stale_pending_orders();$$
);
