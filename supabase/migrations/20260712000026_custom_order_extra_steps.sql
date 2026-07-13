-- TASK-37項目1: オーダーメイド追加工程の正式登録。
--
-- 【重要】以下2件のstep_no=11,12の工程は仮の名称・件数である。実際の工程名・件数・要否は
-- 「人間へのヒアリングで工程名を確定」(要件定義書 残課題#1)が必要なため、正式名称が
-- 確定次第、name_ja/name_enをUPDATEすること(このマイグレーションはis_custom_extra=trueの
-- 行として後日差し替え可能な設計。db_design.md §2.4のとおり)。
--
-- 配置についての設計判断:要件定義書は「工程3〜5の間に追加工程が入る」と記述しているが、
-- 既存工程(1〜7)のstep_noを繰り上げてその間に割り込ませる実装は、production_steps.step_noを
-- 直接参照する既存ロジック(fn_advance_batch_step の完了判定、weekly_throughputビューの
-- step_no=7参照、kanban-board.tsxの検品判定)への影響範囲が広く、正式な工程名・件数が
-- 未確定な現時点でstep_noを振り直すのはリスクが高いと判断した。そのため本マイグレーションでは
-- 検品(step_no=7)の**後**に追加工程を挿入する(標準工程1〜7の並び・step_no・weekly_throughput
-- 集計は一切変更しない、非破壊的な追加)。「3〜5の間」という物理工程上の位置と、
-- デジタルかんばん上の並び順を必ずしも一致させる必要はないという判断(検品自体は
-- 追加工程が全て完了した後に行う運用に読み替える)。この配置が実際の業務フローと合わない場合は、
-- ヒアリング時に位置の見直し(要step_no振り直し)も含めて検討すること。
insert into production_steps (step_no, name_ja, name_en, scope, is_custom_extra) values
  (11, 'オーダーメイド追加工程1(仮称・要ヒアリング確定)', 'Custom Order Extra Step 1 (placeholder, pending hearing)', 'batch', true),
  (12, 'オーダーメイド追加工程2(仮称・要ヒアリング確定)', 'Custom Order Extra Step 2 (placeholder, pending hearing)', 'batch', true)
on conflict (step_no) do nothing;

-- fn_advance_batch_step:「工程7完了で無条件にバッチ完了」というハードコードをやめ、
-- そのバッチに適用される工程(標準工程1〜7 + is_custom時のみis_custom_extra工程)のうち
-- 現在工程より後の最小step_noを次工程とする動的な実装に変更する。
-- 標準バッチ(is_custom=false)は従来どおり工程7で完了する(is_custom_extra行が除外されるため)。
-- 20260712000018時点の定義(fn_check_order_acceptance呼び出しを含む)を引き継ぐ。
create or replace function fn_advance_batch_step(p_batch_id uuid)
returns batch_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_step integer;
  v_status batch_status;
  v_is_custom boolean;
  v_item_count integer;
  v_next_step integer;
begin
  select current_step, status, is_custom into v_current_step, v_status, v_is_custom
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

  select min(step_no) into v_next_step
  from production_steps
  where scope = 'batch'
    and step_no > v_current_step
    and (not is_custom_extra or v_is_custom);

  if v_next_step is null then
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
    set current_step = v_next_step
    where id = p_batch_id;

    return 'in_progress';
  end if;
end;
$$;
