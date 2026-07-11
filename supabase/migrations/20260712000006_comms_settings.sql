-- db_design.md §2.6-2.7: コミュニケーション系(email_logs/custom_order_threads)・設定(settings)

create table email_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  customer_id uuid references customers(id),
  type email_type not null,
  locale locale_type not null,
  subject text not null,
  body text not null,
  status email_status not null default 'draft',
  ai_generated boolean not null default false,
  resend_message_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index email_logs_order_id_idx on email_logs(order_id);
create index email_logs_customer_id_idx on email_logs(customer_id);

-- Phase 2予約。スキーマのみ定義。
create table custom_order_threads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  customer_id uuid not null references customers(id),
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  attachments jsonb not null default '[]',
  ai_draft boolean not null default false,
  created_at timestamptz not null default now()
);

create index custom_order_threads_customer_id_idx on custom_order_threads(customer_id);

create table settings (
  key text primary key,
  value jsonb not null,
  description text
);
