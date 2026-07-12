import { createAdminClient } from '@/lib/supabase/admin'
import { ShippingPoolBoard, type PoolOrder, type PartialOrder } from './_components/shipping-pool-board'

export const dynamic = 'force-dynamic'

type OrderItemRow = {
  id: string
  order_id: string
  production_status: string
  completed_at: string | null
}

export default async function ShippingPoolPage() {
  const supabase = createAdminClient()

  const { data: inspectedRows, error: inspectedError } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('production_status', 'inspected')
  if (inspectedError) throw inspectedError

  const candidateOrderIds = Array.from(new Set((inspectedRows ?? []).map((r) => r.order_id as string)))

  let readyOrders: PoolOrder[] = []
  let partialOrders: PartialOrder[] = []

  if (candidateOrderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('id, order_id, production_status, completed_at')
      .in('order_id', candidateOrderIds)
    if (itemsError) throw itemsError

    const byOrder = new Map<string, { active: number; inspected: number; lastInspectedAt: string | null }>()
    for (const item of (items ?? []) as OrderItemRow[]) {
      if (item.production_status === 'cancelled') continue
      const entry = byOrder.get(item.order_id) ?? { active: 0, inspected: 0, lastInspectedAt: null }
      entry.active += 1
      if (item.production_status === 'inspected') {
        entry.inspected += 1
        if (item.completed_at && (!entry.lastInspectedAt || item.completed_at > entry.lastInspectedAt)) {
          entry.lastInspectedAt = item.completed_at
        }
      }
      byOrder.set(item.order_id, entry)
    }

    const { data: orderRows, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, region, customers(name, email)')
      .in('id', candidateOrderIds)
    if (ordersError) throw ordersError

    const orderInfoById = new Map(
      (orderRows ?? []).map((o) => [
        o.id as string,
        {
          orderNumber: o.order_number as string,
          region: o.region as 'domestic' | 'international',
          customerName:
            (o.customers as unknown as { name: string | null; email: string }[] | null)?.[0]?.name ?? '-',
        },
      ])
    )

    Array.from(byOrder.entries()).forEach(([orderId, stats]) => {
      const info = orderInfoById.get(orderId)
      if (!info) return

      if (stats.active > 0 && stats.inspected === stats.active) {
        readyOrders.push({
          orderId,
          orderNumber: info.orderNumber,
          customerName: info.customerName,
          itemCount: stats.active,
          region: info.region,
          inspectedAt: stats.lastInspectedAt,
        })
      } else if (stats.inspected > 0 && stats.inspected < stats.active) {
        partialOrders.push({
          orderId,
          orderNumber: info.orderNumber,
          customerName: info.customerName,
          itemCount: stats.active,
          region: info.region,
          inspectedAt: stats.lastInspectedAt,
          inspectedCount: stats.inspected,
        })
      }
    })

    readyOrders = readyOrders.sort((a, b) => (a.inspectedAt ?? '').localeCompare(b.inspectedAt ?? ''))
    partialOrders = partialOrders.sort((a, b) => a.orderNumber.localeCompare(b.orderNumber))
  }

  const { data: batchSizeSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'shipping_batch_size')
    .single()
  const recommendedBatchSize = Number(batchSizeSetting?.value ?? 6)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">発送プール</h1>
      <ShippingPoolBoard
        readyOrders={readyOrders}
        partialOrders={partialOrders}
        recommendedBatchSize={recommendedBatchSize}
      />
    </div>
  )
}
