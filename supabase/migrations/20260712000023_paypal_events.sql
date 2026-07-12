-- TASK-22: PayPal Webhookイベントの冪等性担保(同一event_idの二重処理防止、processed_stripe_eventsと同型)
create table processed_paypal_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

alter table processed_paypal_events enable row level security;

-- service_role専用(Webhookハンドラのみが読み書きする)。anon/authenticatedへのポリシーは意図的に無し。
-- 併せて、20260712000022で作成したprocessed_stripe_eventsもRLS未有効化のままだった不備を修正する
-- (Supabaseはanon/authenticatedにpublicスキーマの全テーブルへデフォルトGRANTを付与するため、
--  RLSを有効化しないとStripeイベントIDの読み書きがanon/authenticatedから可能になってしまっていた)。
alter table processed_stripe_events enable row level security;
