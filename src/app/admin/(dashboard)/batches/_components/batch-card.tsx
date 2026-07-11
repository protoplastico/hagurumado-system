export type BatchSummary = {
  id: string
  batch_number: string
  wood_species: string | null
  status: string
  current_step: number | null
  is_custom: boolean
  started_at: string | null
}

function elapsedDays(startedAt: string | null): number | null {
  if (!startedAt) return null
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24))
}

export function BatchCard({ batch, itemCount }: { batch: BatchSummary; itemCount: number }) {
  const days = elapsedDays(batch.started_at)

  return (
    <a href={`/admin/batches/${batch.id}`} className="block rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900">{batch.batch_number}</span>
        {batch.is_custom && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            オーダーメイド
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-600">
        {batch.wood_species ?? '-'} ・ {itemCount}本
      </p>
      <p className="mt-1 text-sm text-gray-500">現工程: {batch.current_step ?? '-'}</p>
      {days !== null && <p className="mt-1 text-xs text-gray-400">経過{days}日</p>}
    </a>
  )
}
