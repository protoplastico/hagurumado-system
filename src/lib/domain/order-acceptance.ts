import type { SupabaseClient } from '@supabase/supabase-js'

// db_design.md §3 / fn_check_order_acceptanceへの型付きラッパー
// 戻り値がtrueの場合、accepting_orders_globalが変化したことを示す(Phase 2でメール通知トリガー予定)

export async function checkOrderAcceptance(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc('fn_check_order_acceptance')
  if (error) throw error
  return data as boolean
}
