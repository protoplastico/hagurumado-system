-- db_design.md §2.2-2.3: 顧客・注文系(customers/orders/order_items + 注文番号採番)
-- order_items.batch_id / shipment_id は production_batches / shipments 作成前のため
-- ここでは列のみ定義し、外部キー制約は 004/005 で追加する。

create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id),
  email text unique not null,
  name text,
  phone text,
  postal_code text,
  address1 text,
  address2 text,
  country text,
  locale locale_type not null default 'ja',
  notes text,
  source order_source,
  created_at timestamptz not null default now()
);

-- 注文番号採番: 日次連番をUPSERT+RETURNINGで同時実行安全に発行
create table order_number_counters (
  day date primary key,
  last_no integer not null
);

create function next_order_number()
returns text
language plpgsql
as $$
declare
  v_day date := current_date;
  v_no integer;
begin
  insert into order_number_counters (day, last_no)
  values (v_day, 1)
  on conflict (day) do update set last_no = order_number_counters.last_no + 1
  returning last_no into v_no;

  return to_char(v_day, 'YYMMDD') || '-' || lpad(v_no::text, 3, '0');
end;
$$;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid references customers(id),
  locale locale_type not null,
  region region_type not null,
  payment_status payment_status not null default 'pending',
  payment_method text,
  payment_ref text,
  subtotal integer not null,
  shipping_fee integer not null,
  total integer not null,
  ship_name text,
  ship_postal text,
  ship_address1 text,
  ship_address2 text,
  ship_country text,
  ship_phone text,
  customer_message text,
  customer_request text,
  desired_delivery_date date,
  admin_memo text,
  source order_source not null,
  external_ref text,
  ordered_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index orders_customer_id_idx on orders(customer_id);

-- order_items(=製作アイテム、物理1本1行)
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  line_no integer not null,
  product_id uuid references products(id),
  product_name text not null,
  variation_name text not null,
  series product_series,
  wood_species text,
  maker pen_maker,
  options_snapshot jsonb not null default '[]',
  custom_note text,
  unit_price integer not null,
  is_custom_order boolean not null default false,
  production_status production_status not null default 'received',
  batch_id uuid,
  shipment_id uuid,
  queued_at timestamptz,
  completed_at timestamptz
);

create index order_items_order_id_idx on order_items(order_id);
create index order_items_batch_id_idx on order_items(batch_id);
create index order_items_status_wood_species_idx on order_items(production_status, wood_species);
