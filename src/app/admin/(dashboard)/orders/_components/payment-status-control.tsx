'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { changePaymentStatus } from '../actions'
import { PAYMENT_STATUS_LABELS } from '@/lib/domain/enums'
import type { PaymentStatus } from '@/lib/domain/payment-status'

const NEXT_STATUSES: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['refunded', 'cancelled'],
  refunded: [],
  cancelled: [],
}

const CONFIRM_REQUIRED: PaymentStatus[] = ['refunded', 'cancelled']

export function PaymentStatusControl({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: PaymentStatus
}) {
  const [pendingStatus, setPendingStatus] = useState<PaymentStatus | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const nextStatuses = NEXT_STATUSES[currentStatus] ?? []

  function requestChange(status: PaymentStatus) {
    if (CONFIRM_REQUIRED.includes(status)) {
      setPendingStatus(status)
      return
    }
    applyChange(status)
  }

  function applyChange(status: PaymentStatus) {
    startTransition(async () => {
      await changePaymentStatus(orderId, status)
      setPendingStatus(null)
      router.refresh()
    })
  }

  if (nextStatuses.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStatuses.map((status) => (
        <button
          key={status}
          type="button"
          disabled={isPending}
          onClick={() => requestChange(status)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          {PAYMENT_STATUS_LABELS[status]}にする
        </button>
      ))}

      {pendingStatus && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <p className="mb-4 text-sm text-gray-700">
              決済ステータスを「{PAYMENT_STATUS_LABELS[pendingStatus]}」に変更します。
              {pendingStatus === 'cancelled' && '未着手のアイテムはキャンセルとして連動します。'}
              よろしいですか？
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingStatus(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm"
              >
                やめる
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => applyChange(pendingStatus)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                実行する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
