import type { SupabaseClient } from '@supabase/supabase-js'

export type DashboardStats = {
  newOrdersLast24h: number
  queueTotal: number
  estimatedWaitWeeks: number | null
  acceptingOrders: boolean
  inProgressByStep: { stepNo: number; itemCount: number }[]
  shippingPoolCount: number
}

// A-02ダッシュボード(screen_design.md)向けの集計取得。
// production_queue/weekly_throughput等は service_role のみ読取可(db_design.md §4)のため、
// service role clientでの呼び出しを前提とする。
export async function getDashboardStats(supabase: SupabaseClient): Promise<DashboardStats> {
  const [
    newOrdersResult,
    queueTotalResult,
    waitWeeksResult,
    acceptingResult,
    inProgressResult,
    shippingPoolResult,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('ordered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .in('production_status', ['received', 'queued']),
    supabase.from('estimated_wait_weeks').select('estimated_wait_weeks').single(),
    supabase.from('settings').select('value').eq('key', 'accepting_orders_global').single(),
    supabase
      .from('order_items')
      .select('batch_id, production_batches!inner(current_step)')
      .eq('production_status', 'in_batch'),
    supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('production_status', 'inspected'),
  ])

  const inProgressCounts = new Map<number, number>()
  for (const row of (inProgressResult.data ?? []) as unknown as {
    production_batches: { current_step: number | null }
  }[]) {
    const stepNo = row.production_batches?.current_step
    if (stepNo == null) continue
    inProgressCounts.set(stepNo, (inProgressCounts.get(stepNo) ?? 0) + 1)
  }

  return {
    newOrdersLast24h: newOrdersResult.count ?? 0,
    queueTotal: queueTotalResult.count ?? 0,
    estimatedWaitWeeks: waitWeeksResult.data?.estimated_wait_weeks ?? null,
    acceptingOrders: acceptingResult.data?.value === true,
    inProgressByStep: Array.from(inProgressCounts.entries())
      .map(([stepNo, itemCount]) => ({ stepNo, itemCount }))
      .sort((a, b) => a.stepNo - b.stepNo),
    shippingPoolCount: shippingPoolResult.count ?? 0,
  }
}
