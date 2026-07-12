import type { SupabaseClient } from '@supabase/supabase-js'

export type DashboardStats = {
  newOrdersLast24h: number
  queueTotal: number
  estimatedWaitWeeks: number | null
  acceptingOrders: boolean
  acceptingOrdersOverrideActive: boolean
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
    overrideResult,
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
    supabase.from('settings').select('value').eq('key', 'accepting_orders_override_active').single(),
    supabase
      .from('order_items')
      .select('batch_id, production_batches!inner(current_step)')
      .eq('production_status', 'in_batch'),
    supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('production_status', 'inspected'),
  ])

  for (const result of [
    newOrdersResult,
    queueTotalResult,
    waitWeeksResult,
    acceptingResult,
    overrideResult,
    inProgressResult,
    shippingPoolResult,
  ]) {
    if (result.error) throw result.error
  }

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
    acceptingOrdersOverrideActive: overrideResult.data?.value === true,
    inProgressByStep: Array.from(inProgressCounts.entries())
      .map(([stepNo, itemCount]) => ({ stepNo, itemCount }))
      .sort((a, b) => a.stepNo - b.stepNo),
    shippingPoolCount: shippingPoolResult.count ?? 0,
  }
}

export type WeeklyThroughputPoint = { weekLabel: string; itemCount: number }

// batch_step_logs(検品=step_no 7)を直近N週(ローリング7日単位)に集計する。
// weekly_throughputビューは現在値(4週移動平均)のみを返す設計のため、
// 推移グラフ用に別途ここで週次バケット化する。
export async function getWeeklyThroughputHistory(
  supabase: SupabaseClient,
  weeks = 12
): Promise<WeeklyThroughputPoint[]> {
  const now = new Date()
  const since = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('batch_step_logs')
    .select('completed_at, item_count')
    .eq('step_no', 7)
    .gte('completed_at', since.toISOString())
  if (error) throw error

  const rows = (data ?? []) as { completed_at: string; item_count: number }[]
  const points: WeeklyThroughputPoint[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const bucketEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const bucketStart = new Date(bucketEnd.getTime() - 7 * 24 * 60 * 60 * 1000)
    const itemCount = rows
      .filter((row) => {
        const t = new Date(row.completed_at).getTime()
        return t >= bucketStart.getTime() && t < bucketEnd.getTime()
      })
      .reduce((sum, row) => sum + row.item_count, 0)

    points.push({
      weekLabel: `${bucketStart.getMonth() + 1}/${bucketStart.getDate()}`,
      itemCount,
    })
  }

  return points
}

export type WoodSpeciesBacklog = { woodSpecies: string; count: number }

export async function getTopWoodSpeciesBacklog(
  supabase: SupabaseClient,
  limit = 5
): Promise<WoodSpeciesBacklog[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('wood_species')
    .in('production_status', ['received', 'queued'])
  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of (data ?? []) as { wood_species: string | null }[]) {
    if (!row.wood_species) continue
    counts.set(row.wood_species, (counts.get(row.wood_species) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([woodSpecies, count]) => ({ woodSpecies, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
