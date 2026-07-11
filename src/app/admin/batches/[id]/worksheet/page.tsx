import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PrintButton } from './print-button'

export const dynamic = 'force-dynamic'

type OptionSnapshotEntry = { group: string; value: string; delta?: number }

type WorksheetItem = {
  id: string
  line_no: number
  variation_name: string
  maker: string | null
  options_snapshot: OptionSnapshotEntry[] | null
  custom_note: string | null
  is_custom_order: boolean
  order_id: string
}

// options_snapshotのgroup名は移行時の商品オプション統合整理で変わりうるため、
// 部分一致でそれらしいグループを拾う(完全一致だと表記ゆれで空欄になりやすい)。
function findOption(options: OptionSnapshotEntry[] | null, keyword: string): string {
  if (!options) return '-'
  const found = options.find((opt) => opt.group.includes(keyword))
  return found ? found.value : '-'
}

export default async function BatchWorksheetPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: batch, error } = await supabase
    .from('production_batches')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !batch) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('id, line_no, variation_name, maker, options_snapshot, custom_note, is_custom_order, order_id')
    .eq('batch_id', params.id)
    .order('line_no', { ascending: true })

  const orderIds = Array.from(new Set((items ?? []).map((item) => item.order_id)))
  const { data: orders } = orderIds.length > 0
    ? await supabase.from('orders').select('id, order_number').in('id', orderIds)
    : { data: [] }
  const orderNumberById = new Map((orders ?? []).map((o) => [o.id as string, o.order_number as string]))

  const worksheetItems = (items ?? []) as WorksheetItem[]

  return (
    <div className="mx-auto max-w-[277mm] p-6 print:p-0">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold text-gray-900">製作指示書プレビュー</h1>
        <PrintButton />
      </div>

      <header className="mb-4 flex items-end justify-between border-b-2 border-gray-900 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">製作指示書</h1>
          <p className="mt-1 text-sm text-gray-700">
            バッチ番号: {batch.batch_number} ・ 樹種: {batch.wood_species ?? '-'}
            {batch.is_custom && ' ・ オーダーメイド'}
          </p>
        </div>
        <div className="text-right text-sm text-gray-700">
          <p>作成日: {new Date().toLocaleDateString('ja-JP')}</p>
          <p>本数: {worksheetItems.length}本</p>
        </div>
      </header>

      <table className="w-full border-collapse text-[10px] leading-tight">
        <thead>
          <tr className="border-b-2 border-gray-900 text-left">
            <th className="px-1 py-1">No</th>
            <th className="px-1 py-1">注文番号</th>
            <th className="px-1 py-1">機種</th>
            <th className="px-1 py-1">軸形状</th>
            <th className="px-1 py-1">仕上げ</th>
            <th className="px-1 py-1">ボタン</th>
            <th className="px-1 py-1">インク染め</th>
            <th className="px-1 py-1">利き手</th>
            <th className="px-1 py-1">焼印</th>
            <th className="px-1 py-1">特注記述</th>
            <th className="px-1 py-1">オーダー</th>
          </tr>
        </thead>
        <tbody>
          {worksheetItems.map((item) => (
            <tr key={item.id} className="border-b border-gray-300 align-top">
              <td className="px-1 py-1">{item.line_no}</td>
              <td className="px-1 py-1">{orderNumberById.get(item.order_id) ?? '-'}</td>
              <td className="px-1 py-1">
                {item.maker ? `[${item.maker}] ` : ''}
                {item.variation_name}
              </td>
              <td className="px-1 py-1">{findOption(item.options_snapshot, '形状')}</td>
              <td className="px-1 py-1">{findOption(item.options_snapshot, '仕上げ')}</td>
              <td className="px-1 py-1">{findOption(item.options_snapshot, 'ボタン')}</td>
              <td className="px-1 py-1">{findOption(item.options_snapshot, 'インク')}</td>
              <td className="px-1 py-1">{findOption(item.options_snapshot, '利き手')}</td>
              <td className="px-1 py-1">{findOption(item.options_snapshot, '焼印')}</td>
              <td className="px-1 py-1">
                {item.custom_note ? (
                  <span className="inline-block border-2 border-gray-900 px-1 py-0.5 font-medium">
                    {item.custom_note}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-1 py-1">{item.is_custom_order ? '●' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
