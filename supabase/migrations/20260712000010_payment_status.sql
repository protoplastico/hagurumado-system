-- TASK-05 A-04: 決済ステータス手動変更(SECURITY DEFINER)
-- payment_status 遷移: pending → paid → (refunded | cancelled)、pending → cancelled も許可。
-- cancelled時のみ、まだ生産着手前後(received/queued/in_batch)のアイテムをcancelledへ連動させる。
-- (inspected以降まで進んだアイテムは物理的に後戻りできないため対象外。個別対応が必要な場合は
--  fn_return_item_to_queue等を別途使う想定。)

create function fn_update_payment_status(p_order_id uuid, p_new_status payment_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current payment_status;
begin
  select payment_status into v_current
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'fn_update_payment_status: order % not found', p_order_id;
  end if;

  if not (
    (v_current = 'pending' and p_new_status in ('paid', 'cancelled')) or
    (v_current = 'paid' and p_new_status in ('refunded', 'cancelled'))
  ) then
    raise exception 'fn_update_payment_status: invalid transition % -> %', v_current, p_new_status;
  end if;

  update orders
  set payment_status = p_new_status
  where id = p_order_id;

  if p_new_status = 'cancelled' then
    update order_items
    set production_status = 'cancelled'
    where order_id = p_order_id
      and production_status in ('received', 'queued', 'in_batch');
  end if;
end;
$$;
