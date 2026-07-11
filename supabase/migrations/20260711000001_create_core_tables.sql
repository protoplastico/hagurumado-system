-- Phase 1: 顧客・問い合わせ(要件定義)・受注のコアテーブル

create extension if not exists "pgcrypto";

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 顧客
create table customers (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  contact_name text not null,
  email text not null,
  phone text,
  postal_code text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

-- 問い合わせ・要件定義(AIヒアリング自動化の対象)
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  source text not null default 'web_form',
  raw_message text not null,
  ai_structured_data jsonb,
  status text not null default 'new'
    check (status in ('new', 'ai_processing', 'requirements_confirmed', 'converted_to_order', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inquiries_customer_id_idx on inquiries(customer_id);
create index inquiries_status_idx on inquiries(status);

create trigger inquiries_set_updated_at
  before update on inquiries
  for each row execute function set_updated_at();

-- 受注
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete restrict,
  inquiry_id uuid references inquiries(id) on delete set null,
  status text not null default 'quote'
    check (status in ('quote', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_id_idx on orders(customer_id);
create index orders_status_idx on orders(status);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- 受注明細
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  item_name text not null,
  specification text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  subtotal numeric(12, 2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index order_items_order_id_idx on order_items(order_id);

create trigger order_items_set_updated_at
  before update on order_items
  for each row execute function set_updated_at();

-- RLS: 現時点では管理画面(認証済みユーザー)のみアクセス許可。匿名アクセスはデフォルト拒否。
-- サーバー側のservice role clientはRLSをバイパスするため、管理系のサーバーアクションはこの制約を受けない。
alter table customers enable row level security;
alter table inquiries enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Authenticated users can manage customers"
  on customers for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage inquiries"
  on inquiries for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage orders"
  on orders for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage order_items"
  on order_items for all
  to authenticated
  using (true)
  with check (true);
