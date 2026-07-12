-- TASK-14: バッチ工程完了時(検品完了→一括inspected化のタイミング)にも
-- fn_check_order_acceptance()を呼び出す(キュー滞留数が変化するため)。

create or replace function fn_advance_batch_step(p_batch_id uuid)
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

    perform fn_check_order_acceptance();

    return 'completed';
  else
    update production_batches
    set current_step = v_current_step + 1
    where id = p_batch_id;

    return 'in_progress';
  end if;
end;
$$;
