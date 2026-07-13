import type { CustomOrderStatus } from '@/lib/domain/custom-order'

export const STATUS_LABELS: Record<CustomOrderStatus, string> = {
  new: '新規',
  diagnosing: '診断中',
  proposed: '提案済',
  agreed: '合意済',
  ordered: '受注化済',
  closed: '完了',
}

const STATUS_COLORS: Record<CustomOrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  diagnosing: 'bg-amber-100 text-amber-800',
  proposed: 'bg-purple-100 text-purple-800',
  agreed: 'bg-teal-100 text-teal-800',
  ordered: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}

export function StatusBadge({ status }: { status: CustomOrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
