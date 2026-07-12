-- TASK-11 A-10: fn_mark_shipped実行時にemail_logsへ発送完了メールのdraftを作成する。
-- 送信はTASK-13の承認フロー経由(ここではdraft作成のみ、AI生成本文への差し替えもTASK-12/13)。

create or replace function fn_mark_shipped(p_shipment_id uuid, p_carrier carrier_type, p_tracking_number text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shipped_at timestamptz;
  v_shipping_batch_id uuid;
  v_order_id uuid;
  v_remaining_unshipped integer;
  v_order_number text;
  v_locale locale_type;
  v_customer_id uuid;
  v_subject text;
  v_body text;
begin
  select shipped_at, shipping_batch_id, order_id into v_shipped_at, v_shipping_batch_id, v_order_id
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

  select order_number, locale, customer_id into v_order_number, v_locale, v_customer_id
  from orders
  where id = v_order_id;

  if v_locale = 'en' then
    v_subject := 'Your order ' || v_order_number || ' has shipped';
    v_body := 'Your order ' || v_order_number || ' has shipped via ' || p_carrier ||
      '. Tracking number: ' || p_tracking_number;
  else
    v_subject := '【葉車堂】ご注文(' || v_order_number || ')を発送いたしました';
    v_body := '配送業者: ' || p_carrier || E'\n追跡番号: ' || p_tracking_number;
  end if;

  insert into email_logs (order_id, customer_id, type, locale, subject, body, status, ai_generated)
  values (v_order_id, v_customer_id, 'shipped', v_locale, v_subject, v_body, 'draft', false);

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
