-- db_design.md §2.4: 生産系(production_steps/production_batches/batch_step_logs + バッチ番号採番)

create table production_steps (
  step_no integer primary key,
  name_ja text not null,
  name_en text,
  scope text not null check (scope in ('batch', 'shipping')),
  is_custom_extra boolean not null default false
);

create table production_batches (
  id uuid primary key default gen_random_uuid(),
  batch_number text unique not null,
  wood_species text,
  status batch_status not null default 'planned',
  current_step integer references production_steps(step_no),
  is_custom boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  notes text
);

create table batch_step_logs (
  batch_id uuid not null references production_batches(id) on delete cascade,
  step_no integer not null references production_steps(step_no),
  completed_at timestamptz not null,
  item_count integer not null,
  primary key (batch_id, step_no)
);

-- バッチ番号採番: B+YYMMDD-NN(日次連番、同時実行安全)
create table production_batch_number_counters (
  day date primary key,
  last_no integer not null
);

create function next_batch_number()
returns text
language plpgsql
as $$
declare
  v_day date := current_date;
  v_no integer;
begin
  insert into production_batch_number_counters (day, last_no)
  values (v_day, 1)
  on conflict (day) do update set last_no = production_batch_number_counters.last_no + 1
  returning last_no into v_no;

  return 'B' || to_char(v_day, 'YYMMDD') || '-' || lpad(v_no::text, 2, '0');
end;
$$;

-- order_itemsのbatch_id外部キー制約(production_batches作成後にここで追加)
alter table order_items
  add constraint order_items_batch_id_fkey
  foreign key (batch_id) references production_batches(id);
