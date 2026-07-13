'use client'

import { useState, useTransition } from 'react'
import type { CustomOrderStatus } from '@/lib/domain/custom-order'
import { updateInquiryStatus } from '../../actions'
import { STATUS_LABELS } from '../../_components/status-badge'

const ALL_STATUSES: CustomOrderStatus[] = ['new', 'diagnosing', 'proposed', 'agreed', 'ordered', 'closed']

export function StatusControl({ inquiryId, currentStatus }: { inquiryId: string; currentStatus: CustomOrderStatus }) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  function handleChange(next: CustomOrderStatus) {
    setStatus(next)
    startTransition(() => {
      updateInquiryStatus(inquiryId, next)
    })
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">状態:</span>
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as CustomOrderStatus)}
        disabled={isPending}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {isPending && <span className="text-xs text-gray-400">更新中...</span>}
    </label>
  )
}
