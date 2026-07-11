-- db_design.md §0-1: 拡張機能・共通ユーティリティ・ENUM定義

create extension if not exists "pgcrypto";

-- updated_at自動更新用トリガー関数(created_at/updated_at両方を持つテーブルのみ使用)
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type payment_status as enum ('pending', 'paid', 'refunded', 'cancelled');

create type production_status as enum (
  'received',      -- 受付(決済確認済、キュー登録前)
  'queued',        -- キュー待ち
  'in_batch',      -- 製作中(バッチ所属、工程はバッチ側で管理)
  'inspected',     -- 検品済(発送プール)
  'ready_to_ship', -- 発送バッチ編成済
  'shipped',       -- 発送済
  'completed',     -- 完了
  'cancelled'      -- キャンセル
);

create type region_type as enum ('domestic', 'international');

create type locale_type as enum ('ja', 'en');

create type pen_maker as enum ('WACOM', 'XPPEN', 'XENCELABS', 'APPLE', 'OTHER');

create type product_series as enum ('LITE', 'ERGO', 'WAZAI', 'PRO', 'PREMIUM', 'APPLE_PENCIL', 'OTHER');

create type batch_status as enum ('planned', 'in_progress', 'completed');

create type shipping_batch_status as enum ('preparing', 'shipped');

create type carrier_type as enum ('clickpost', 'ems', 'other');

create type email_type as enum ('order_confirm', 'production_start', 'shipped', 'delay', 'custom_thread', 'other');

create type email_status as enum ('draft', 'approved', 'sent', 'failed');

create type order_source as enum ('own_site', 'base_import');
