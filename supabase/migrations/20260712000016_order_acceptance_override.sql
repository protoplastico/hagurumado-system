-- TASK-14: 受注自動制御の手動オーバーライド。
-- 管理者がA-15でaccepting_orders_globalを直接編集した場合、
-- fn_check_order_acceptance()による自動上書きを停止する。

insert into settings (key, value, description) values
  ('accepting_orders_override_active', 'false', '受注受付フラグの手動オーバーライド中フラグ(true時はfn_check_order_acceptanceによる自動変更を停止)')
on conflict (key) do nothing;

create or replace function fn_check_order_acceptance()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_override_active boolean;
  v_wait_weeks numeric;
  v_wait_days numeric;
  v_threshold_days numeric;
  v_current boolean;
  v_new boolean;
begin
  select (value #>> '{}')::boolean into v_override_active
  from settings where key = 'accepting_orders_override_active';

  if coalesce(v_override_active, false) then
    return false;
  end if;

  select estimated_wait_weeks into v_wait_weeks from estimated_wait_weeks;
  select (value #>> '{}')::numeric into v_threshold_days
    from settings where key = 'order_stop_threshold_days';
  select (value #>> '{}')::boolean into v_current
    from settings where key = 'accepting_orders_global';

  v_wait_days := coalesce(v_wait_weeks, 0) * 7;
  v_new := v_wait_days <= v_threshold_days;

  if v_new is distinct from v_current then
    update settings set value = to_jsonb(v_new) where key = 'accepting_orders_global';
    return true;
  end if;

  return false;
end;
$$;
