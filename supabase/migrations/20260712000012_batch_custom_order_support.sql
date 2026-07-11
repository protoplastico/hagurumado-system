-- TASK-06 A-05: fn_create_batchにオーダーメイド単独バッチ対応を追加
-- オーダーメイド品(is_custom_order=true)は標準品と混在不可、かつ単独(1本)バッチとしてのみ作成可能。
-- production_batches.is_custom を実際に設定するのはこの変更が初めて(TASK-03時点では未設定のままだった)。
--
-- あわせて許可ステータスを'queued'のみから'received'/'queued'両方に拡張する。
-- production_queueビュー(A-05生産キュー画面)はreceived+queuedを一体のキューとして表示し、
-- そこから直接バッチ作成する設計のため(received→queuedの個別遷移関数はTASK-03/05では
-- 設けていない)、バッチ作成そのものが実質的なキュー登録を兼ねる。

create or replace function fn_create_batch(p_wood_species text, p_item_ids uuid[])
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
  v_custom_count integer;
  v_is_custom boolean;
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
    and production_status not in ('received', 'queued');

  if v_invalid_status_count > 0 then
    raise exception 'fn_create_batch: % item(s) are not in received/queued status', v_invalid_status_count;
  end if;

  select count(*) into v_species_mismatch_count
  from order_items
  where id = any(p_item_ids)
    and wood_species is distinct from p_wood_species;

  if v_species_mismatch_count > 0 then
    raise exception 'fn_create_batch: all items must match wood_species %', p_wood_species;
  end if;

  select count(*) into v_custom_count
  from order_items
  where id = any(p_item_ids)
    and is_custom_order = true;

  if v_custom_count > 0 and v_custom_count <> array_length(p_item_ids, 1) then
    raise exception 'fn_create_batch: cannot mix custom-order and standard items in one batch';
  end if;

  v_is_custom := v_custom_count > 0;

  if v_is_custom and array_length(p_item_ids, 1) <> 1 then
    raise exception 'fn_create_batch: custom-order batches must contain exactly one item';
  end if;

  v_batch_number := next_batch_number();

  insert into production_batches (batch_number, wood_species, status, current_step, is_custom, started_at)
  values (v_batch_number, p_wood_species, 'in_progress', 1, v_is_custom, now())
  returning id into v_batch_id;

  update order_items
  set batch_id = v_batch_id,
      production_status = 'in_batch'
  where id = any(p_item_ids);

  return v_batch_id;
end;
$$;
