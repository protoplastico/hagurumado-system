-- TASK-16 修正1・修正2: 発送バッチ作成時の決済ステータス検証追加+cancelledアイテムの扱い修正
--
-- 修正1(高): payment_status='paid'でない注文(cancelled/refunded/pending)が発送バッチ作成できてしまう不具合を修正。
-- 修正2(中): 未検品カウントの判定にcancelledアイテムが含まれ、UI側(cancelled除外)と矛盾していたため、
--            production_status not in ('inspected', 'cancelled') に変更(cancelledは発送対象外として無視する)。
--            ready_to_shipへのUPDATE対象は従来どおりinspectedのみ(cancelledには触れない)。

create or replace function fn_create_shipping_batch(p_order_ids uuid[])
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
  v_unpaid_orders integer;
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

  select count(*) into v_unpaid_orders
  from orders
  where id = any(p_order_ids)
    and payment_status <> 'paid';

  if v_unpaid_orders > 0 then
    raise exception 'fn_create_shipping_batch: % order(s) are not paid', v_unpaid_orders;
  end if;

  select count(*) into v_uninspected_count
  from order_items
  where order_id = any(p_order_ids)
    and production_status not in ('inspected', 'cancelled');

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

-- TASK-16 修正3: 稼働初期(batch_step_logs空)でestimated_wait_weeksがnullになり、
-- 受注自動停止が作動しない問題への対策。要件定義書§2.4のバッチサイズ約20本/サイクル・
-- 所要日数約6日から、週あたり実績相当値 20÷6×7≒23 を初期値として設定する。
-- 実績4週分が溜まったら管理画面(A-15)からnullに戻し、実績算出に切り替えること。
update settings set value = '23' where key = 'weekly_throughput_override';
