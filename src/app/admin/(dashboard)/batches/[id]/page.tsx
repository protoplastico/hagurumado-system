import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// TASK-06時点の暫定表示。工程かんばん(A-07)の本実装はTASK-07で行う。
export default async function BatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: batch, error } = await supabase
    .from('production_batches')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !batch) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('id, product_name, variation_name, wood_species')
    .eq('batch_id', params.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{batch.batch_number}</h1>
        <p className="text-sm text-gray-500">
          樹種: {batch.wood_species ?? '-'} ・ 工程: {batch.current_step ?? '-'} ・ ステータス: {batch.status}
          {batch.is_custom && ' ・ オーダーメイド'}
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
        工程かんばん(A-07)はTASK-07で実装予定です。バッチが作成され、以下のアイテムが in_batch
        になっていることのみ、この画面で確認できます。
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">バッチ内アイテム({(items ?? []).length}本)</h2>
        <ul className="space-y-2">
          {(items ?? []).map((item) => (
            <li key={item.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
              {item.product_name} / {item.variation_name} ・ {item.wood_species}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
