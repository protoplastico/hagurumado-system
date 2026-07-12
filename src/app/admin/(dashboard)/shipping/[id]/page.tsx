import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShipmentList, type ShipmentRow } from './_components/shipment-list'
import type { Carrier } from '@/lib/domain/shipping'

export const dynamic = 'force-dynamic'

type ShipmentQueryRow = {
  id: string
  order_id: string
  carrier: Carrier | null
  tracking_number: string | null
  shipped_at: string | null
  orders: {
    order_number: string
    ship_name: string | null
    ship_postal: string | null
    ship_address1: string | null
    ship_address2: string | null
    ship_country: string | null
    ship_phone: string | null
    region: 'domestic' | 'international'
  }[]
}

export default async function ShippingBatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: batch, error } = await supabase
    .from('shipping_batches')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !batch) notFound()

  const { data: shipmentRows, error: shipmentsError } = await supabase
    .from('shipments')
    .select(
      'id, order_id, carrier, tracking_number, shipped_at, orders(order_number, ship_name, ship_postal, ship_address1, ship_address2, ship_country, ship_phone, region)'
    )
    .eq('shipping_batch_id', params.id)
  if (shipmentsError) throw shipmentsError

  const shipments: ShipmentRow[] = ((shipmentRows ?? []) as unknown as ShipmentQueryRow[]).map((s) => {
    const order = s.orders[0]
    return {
      shipmentId: s.id,
      orderId: s.order_id,
      orderNumber: order?.order_number ?? '-',
      shipName: order?.ship_name ?? '-',
      shipPostal: order?.ship_postal ?? '',
      shipAddress1: order?.ship_address1 ?? '',
      shipAddress2: order?.ship_address2 ?? null,
      shipCountry: order?.ship_country ?? null,
      shipPhone: order?.ship_phone ?? null,
      region: order?.region ?? 'domestic',
      carrier: s.carrier,
      trackingNumber: s.tracking_number,
      shippedAt: s.shipped_at,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{batch.batch_number}</h1>
        <p className="text-sm text-gray-500">
          ステータス: {batch.status === 'shipped' ? '発送済み' : '準備中'} ・ {shipments.length}件
        </p>
      </div>

      <ShipmentList batchId={params.id} batchStatus={batch.status} shipments={shipments} />
    </div>
  )
}
