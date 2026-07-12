import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// TASK-10時点の暫定表示。発送バッチ詳細(A-10、宛名CSV出力・伝票番号入力)の本実装はTASK-11で行う。
export default async function ShippingBatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: batch, error } = await supabase
    .from('shipping_batches')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !batch) notFound()

  const { data: shipments } = await supabase
    .from('shipments')
    .select('id, order_id, carrier, tracking_number, orders(order_number)')
    .eq('shipping_batch_id', params.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{batch.batch_number}</h1>
        <p className="text-sm text-gray-500">ステータス: {batch.status}</p>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
        発送バッチ詳細(A-10、宛名CSV出力・伝票番号入力)はTASK-11で実装予定です。バッチが作成され、
        以下の注文がready_to_shipになっていることのみ、この画面で確認できます。
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">含まれる注文({(shipments ?? []).length}件)</h2>
        <ul className="space-y-2">
          {(shipments ?? []).map((s) => (
            <li key={s.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
              {(s.orders as unknown as { order_number: string }[] | null)?.[0]?.order_number ?? s.order_id}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
