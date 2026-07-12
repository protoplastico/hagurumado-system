import type { SupabaseClient } from '@supabase/supabase-js'

export type OrderAcceptanceStatus = {
  acceptingOrders: boolean
  estimatedWaitWeeks: number | null
}

// S-01の受注状態バナー用。settings.accepting_orders_globalとestimated_wait_weeksビューは
// いずれもanonに公開済み(20260712000008_rls.sql / 20260712000020_public_accepting_orders_setting.sql)。
export async function getOrderAcceptanceStatus(supabase: SupabaseClient): Promise<OrderAcceptanceStatus> {
  const [acceptingResult, waitWeeksResult] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'accepting_orders_global').single(),
    supabase.from('estimated_wait_weeks').select('estimated_wait_weeks').single(),
  ])

  if (acceptingResult.error) throw acceptingResult.error
  if (waitWeeksResult.error) throw waitWeeksResult.error

  return {
    acceptingOrders: acceptingResult.data?.value === true,
    estimatedWaitWeeks: waitWeeksResult.data?.estimated_wait_weeks ?? null,
  }
}
