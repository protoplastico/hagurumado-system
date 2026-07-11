-- db_design.md §2.1: 商品系(products/variations/option_groups/option_values/product_option_groups)

create table products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  series product_series not null,
  name_ja text not null,
  name_en text not null,
  wood_species_ja text,
  wood_species_en text,
  price_domestic integer not null,
  price_international integer not null,
  is_custom_order boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  sanity_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

create table variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name_ja text not null,
  name_en text not null,
  maker pen_maker not null,
  model_code text,
  accepting_orders boolean not null default true,
  sort_order integer not null default 0
);

create index variations_product_id_idx on variations(product_id);

create table option_groups (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_ja text not null,
  name_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table option_values (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references option_groups(id) on delete cascade,
  name_ja text not null,
  name_en text not null,
  price_delta_domestic integer not null default 0,
  price_delta_international integer not null default 0,
  requires_note boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create index option_values_group_id_idx on option_values(group_id);

create table product_option_groups (
  product_id uuid not null references products(id) on delete cascade,
  option_group_id uuid not null references option_groups(id) on delete cascade,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  primary key (product_id, option_group_id)
);
