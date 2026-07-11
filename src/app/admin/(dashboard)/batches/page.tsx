import { createAdminClient } from '@/lib/supabase/admin'
import { BatchTabs } from './_components/batch-tabs'
import { BatchCard, type BatchSummary } from './_components/batch-card'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['in_progress', 'planned', 'completed']

export default async function BatchesPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createAdminClient()
  const status = VALID_STATUSES.includes(searchParams.status ?? '') ? searchParams.status! : 'in_progress'

  const { data: batches, error } = await supabase
    .from('production_batches')
    .select('*')
    .eq('status', status)
    .order('started_at', { ascending: false })

  if (error) throw error

  const batchList = (batches ?? []) as BatchSummary[]
  const batchIds = batchList.map((b) => b.id)

  const itemCounts = new Map<string, number>()
  if (batchIds.length > 0) {
    const { data: items } = await supabase.from('order_items').select('batch_id').in('batch_id', batchIds)
    for (const item of items ?? []) {
      const batchId = item.batch_id as string
      itemCounts.set(batchId, (itemCounts.get(batchId) ?? 0) + 1)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">バッチ一覧</h1>
      <BatchTabs current={status} />
      {batchList.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          該当するバッチがありません。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batchList.map((batch) => (
            <BatchCard key={batch.id} batch={batch} itemCount={itemCounts.get(batch.id) ?? 0} />
          ))}
        </div>
      )}
    </div>
  )
}
