-- db_design.md §2.5: 発送系(shipping_batches/shipments + 発送バッチ番号採番)

create table shipping_batches (
  id uuid primary key default gen_random_uuid(),
  batch_number text unique not null,
  status shipping_batch_status not null default 'preparing',
  shipped_at timestamptz,
  notes text
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id),
  shipping_batch_id uuid references shipping_batches(id),
  carrier carrier_type,
  tracking_number text,
  shipped_at timestamptz
);

-- 発送バッチ番号採番: S+YYMMDD-NN(日次連番、同時実行安全)
create table shipping_batch_number_counters (
  day date primary key,
  last_no integer not null
);

create function next_shipping_batch_number()
returns text
language plpgsql
as $$
declare
  v_day date := current_date;
  v_no integer;
begin
  insert into shipping_batch_number_counters (day, last_no)
  values (v_day, 1)
  on conflict (day) do update set last_no = shipping_batch_number_counters.last_no + 1
  returning last_no into v_no;

  return 'S' || to_char(v_day, 'YYMMDD') || '-' || lpad(v_no::text, 2, '0');
end;
$$;

-- order_itemsのshipment_id外部キー制約(shipments作成後にここで追加)
alter table order_items
  add constraint order_items_shipment_id_fkey
  foreign key (shipment_id) references shipments(id);
