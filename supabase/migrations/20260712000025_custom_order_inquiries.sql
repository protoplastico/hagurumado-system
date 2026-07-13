-- TASK-35 S-13: オーダーメイド申込フォーム。
-- custom_order_inquiriesは申込(質問票)の記録。customer_id FKに加え、CLAUDE.mdのスナップショット
-- 原則にならいcustomer_email/customer_nameを申込時点の値として複製保存する(ordersのship_name等と
-- 同じ考え方。customersの氏名が後で変わっても申込内容の記録は変えない)。
-- 非ログインでも申込可能(受入条件)なため、申込時にemailでcustomersをupsertしてcustomer_idを得る
-- 実装とする(checkout時のcreatePendingOrderと同じ名寄せパターン)。

create type custom_order_status as enum ('new', 'diagnosing', 'proposed', 'agreed', 'ordered', 'closed');

create table custom_order_inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  customer_email text not null,
  customer_name text not null,
  locale locale_type not null,
  status custom_order_status not null default 'new',
  answers jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index custom_order_inquiries_status_idx on custom_order_inquiries(status);
create index custom_order_inquiries_customer_id_idx on custom_order_inquiries(customer_id);

alter table custom_order_threads add column inquiry_id uuid references custom_order_inquiries(id);
create index custom_order_threads_inquiry_id_idx on custom_order_threads(inquiry_id);

alter table custom_order_inquiries enable row level security;
-- email_logs/custom_order_threads/settingsと同様、anon/authenticated向けポリシーは作成しない
-- (申込・閲覧とも管理画面/Server Action経由でservice_roleのみが読み書きする)。

-- 写真・動画アップロード用の非公開バケット(署名付きURL経由でのみアップロード・閲覧可能。
-- 公開URL禁止という受入条件のため、product-imagesとは異なりpublic=false・anon向け読取ポリシーなし)。
-- 動画100MB制限はfile_size_limit(バイト)で強制する。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'custom-order-media', 'custom-order-media', false, 104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

insert into settings (key, value, description) values
  ('custom_order_notification_email', '"info@hagurumado.com"', 'オーダーメイド新規申込があった際の通知先メールアドレス(暫定値。実運用アドレスに要更新)')
on conflict (key) do nothing;
