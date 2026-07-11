-- db_design.md §3 / 要件定義書 §2.3-2.4: ステータス遷移・ドメイン関数
-- 全てSECURITY DEFINERで実装し、管理画面/APIはこの関数群のみを経由してステータスを変更する
-- (CLAUDE.md「ステータス遷移はDB関数/専用API経由のみ、UIから直接UPDATEしない」)。
--
-- production_status 遷移マトリクス(許可される遷移のみ。それ以外は全てEXCEPTION)
--   received/queued/in_batch → cancelled       決済キャンセル時(TASK-05領域、本ファイルでは未実装)
--   queued        → in_batch                   fn_create_batch
--   in_batch      → queued                     fn_return_item_to_queue(差戻し)
--   in_batch      → inspected                   fn_advance_batch_step(工程7完了時、一括)
--   inspected     → ready_to_ship               fn_create_shipping_batch
--   ready_to_ship → shipped                      fn_mark_shipped
--   received      → queued                       TASK-05領域(単純なキュー登録操作、本ファイルでは未実装)
--
-- batch_status 遷移: planned → in_progress(current_step 1→7) → completed
--   (本実装ではfn_create_batchでin_progress/step1として開始する。planned単独の待機状態は現状未使用)

-- 1. queuedアイテム検証→バッチ作成→item.batch_id設定→status=in_batch
create function fn_create_batch(p_wood_species text, p_item_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
  v_batch_number text;
  v_found_count integer;
  v_invalid_status_count integer;
  v_species_mismatch_count integer;
begin
  if p_item_ids is null or array_length(p_item_ids, 1) is null then
    raise exception 'fn_create_batch: item_ids must not be empty';
  end if;

  select count(*) into v_found_count
  from order_items
  where id = any(p_item_ids);

  if v_found_count <> array_length(p_item_ids, 1) then
    raise exception 'fn_create_batch: one or more item_ids do not exist';
  end if;

  select count(*) into v_invalid_status_count
  from order_items
  where id = any(p_item_ids)
    and production_status <> 'queued';

  if v_invalid_status_count > 0 then
    raise exception 'fn_create_batch: % item(s) are not in queued status', v_invalid_status_count;
  end if;

  select count(*) into v_species_mismatch_count
  from order_items
  where id = any(p_item_ids)
    and wood_species is distinct from p_wood_species;

  if v_species_mismatch_count > 0 then
    raise exception 'fn_create_batch: all items must match wood_species %', p_wood_species;
  end if;

  v_batch_number := next_batch_number();

  insert into production_batches (batch_number, wood_species, status, current_step, started_at)
  values (v_batch_number, p_wood_species, 'in_progress', 1, now())
  returning id into v_batch_id;

  update order_items
  set batch_id = v_batch_id,
      production_status = 'in_batch'
  where id = any(p_item_ids);

  return v_batch_id;
end;
$$;

-- 2. current_step+1、batch_step_logsへ記録。工程7完了時:バッチcompleted+所属アイテム一括inspected
create function fn_advance_batch_step(p_batch_id uuid)
returns batch_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_step integer;
  v_status batch_status;
  v_item_count integer;
begin
  select current_step, status into v_current_step, v_status
  from production_batches
  where id = p_batch_id
  for update;

  if not found then
    raise exception 'fn_advance_batch_step: batch % not found', p_batch_id;
  end if;

  if v_status <> 'in_progress' then
    raise exception 'fn_advance_batch_step: batch % is not in_progress (status=%)', p_batch_id, v_status;
  end if;

  if v_current_step is null then
    raise exception 'fn_advance_batch_step: batch % has no current_step', p_batch_id;
  end if;

  select count(*) into v_item_count
  from order_items
  where batch_id = p_batch_id
    and production_status = 'in_batch';

  insert into batch_step_logs (batch_id, step_no, completed_at, item_count)
  values (p_batch_id, v_current_step, now(), v_item_count);

  if v_current_step >= 7 then
    update production_batches
    set status = 'completed',
        completed_at = now()
    where id = p_batch_id;

    update order_items
    set production_status = 'inspected',
        completed_at = now()
    where batch_id = p_batch_id
      and production_status = 'in_batch';

    return 'completed';
  else
    update production_batches
    set current_step = v_current_step + 1
    where id = p_batch_id;

    return 'in_progress';
  end if;
end;
$$;

-- 3. 差戻し:バッチから除外→queued、理由を記録
-- 備考:db_design.mdのorder_itemsにはadmin_memo相当の列が無いため、
-- 注文単位のorders.admin_memoに追記する(要仕様確認事項。TASK-03完了報告で明記)。
create function fn_return_item_to_queue(p_item_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status production_status;
  v_order_id uuid;
begin
  select production_status, order_id into v_status, v_order_id
  from order_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'fn_return_item_to_queue: item % not found', p_item_id;
  end if;

  if v_status <> 'in_batch' then
    raise exception 'fn_return_item_to_queue: item % is not in_batch (status=%)', p_item_id, v_status;
  end if;

  update order_items
  set batch_id = null,
      production_status = 'queued',
      queued_at = now()
  where id = p_item_id;

  update orders
  set admin_memo = coalesce(admin_memo || E'\n', '')
    || '[差戻し ' || to_char(now(), 'YYYY-MM-DD HH24:MI') || '] item ' || p_item_id || ': ' || p_reason
  where id = v_order_id;
end;
$$;

-- 4. 全アイテムinspected検証→shipments作成→ready_to_ship
create function fn_create_shipping_batch(p_order_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shipping_batch_id uuid;
  v_batch_number text;
  v_order_id uuid;
  v_shipment_id uuid;
  v_missing_orders integer;
  v_uninspected_count integer;
begin
  if p_order_ids is null or array_length(p_order_ids, 1) is null then
    raise exception 'fn_create_shipping_batch: order_ids must not be empty';
  end if;

  select count(*) into v_missing_orders
  from unnest(p_order_ids) as oid
  where not exists (select 1 from orders where id = oid);

  if v_missing_orders > 0 then
    raise exception 'fn_create_shipping_batch: % order(s) do not exist', v_missing_orders;
  end if;

  select count(*) into v_uninspected_count
  from order_items
  where order_id = any(p_order_ids)
    and production_status <> 'inspected';

  if v_uninspected_count > 0 then
    raise exception 'fn_create_shipping_batch: % item(s) are not inspected yet', v_uninspected_count;
  end if;

  v_batch_number := next_shipping_batch_number();

  insert into shipping_batches (batch_number, status)
  values (v_batch_number, 'preparing')
  returning id into v_shipping_batch_id;

  foreach v_order_id in array p_order_ids loop
    insert into shipments (order_id, shipping_batch_id)
    values (v_order_id, v_shipping_batch_id)
    returning id into v_shipment_id;

    update order_items
    set shipment_id = v_shipment_id,
        production_status = 'ready_to_ship'
    where order_id = v_order_id
      and production_status = 'inspected';
  end loop;

  return v_shipping_batch_id;
end;
$$;

-- 5. shipped遷移+shipped_at。所属shipping_batchの全shipmentsが揃えばbatchもshipped化
create function fn_mark_shipped(p_shipment_id uuid, p_carrier carrier_type, p_tracking_number text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shipped_at timestamptz;
  v_shipping_batch_id uuid;
  v_remaining_unshipped integer;
begin
  select shipped_at, shipping_batch_id into v_shipped_at, v_shipping_batch_id
  from shipments
  where id = p_shipment_id
  for update;

  if not found then
    raise exception 'fn_mark_shipped: shipment % not found', p_shipment_id;
  end if;

  if v_shipped_at is not null then
    raise exception 'fn_mark_shipped: shipment % is already shipped', p_shipment_id;
  end if;

  update shipments
  set carrier = p_carrier,
      tracking_number = p_tracking_number,
      shipped_at = now()
  where id = p_shipment_id;

  update order_items
  set production_status = 'shipped'
  where shipment_id = p_shipment_id
    and production_status = 'ready_to_ship';

  if v_shipping_batch_id is not null then
    select count(*) into v_remaining_unshipped
    from shipments
    where shipping_batch_id = v_shipping_batch_id
      and shipped_at is null;

    if v_remaining_unshipped = 0 then
      update shipping_batches
      set status = 'shipped',
          shipped_at = now()
      where id = v_shipping_batch_id;
    end if;
  end if;
end;
$$;

-- 6. 推定待ち期間(週×7日)が受注停止閾値(日)を超えるかでaccepting_orders_globalを自動制御
-- 戻り値:trueなら値が変化した(呼び出し側でメール通知等をトリガー、Phase 2)
create function fn_check_order_acceptance()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wait_weeks numeric;
  v_wait_days numeric;
  v_threshold_days numeric;
  v_current boolean;
  v_new boolean;
begin
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
