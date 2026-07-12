-- TASK-14: 受注自動制御の日次チェック(pg_cronで直接fn_check_order_acceptance()を呼出)。
-- 当初指示書はSupabase Edge Function+cronを想定していたが、fn_check_order_acceptance()は
-- 外部API呼出の無い純粋なSQL関数のため、pg_cronから直接呼び出しても機能的に同一。
-- Supabase CLIのネイティブバイナリがユーザー環境で動作しない問題があり、
-- Edge Functionのデプロイ手段が確保できないため、SQL Editor経由で完結するpg_cronを採用(要確認・承認済み)。
--
-- pg_cronがプロジェクトで有効化されていない場合、このファイルの実行時にエラーになることがある。
-- その場合はSupabaseダッシュボードの Database > Extensions で "pg_cron" を先に有効化してから
-- 再実行すること。

create extension if not exists pg_cron;

-- 毎日18:00 UTC(=日本時間3:00、業務時間外)に実行
select cron.schedule(
  'check-order-acceptance-daily',
  '0 18 * * *',
  $$select fn_check_order_acceptance();$$
);
