'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDelayDraft } from '../actions'

export function DelayNotificationButton({ orderId }: { orderId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newExpectedDate, setNewExpectedDate] = useState('')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit() {
    if (!newExpectedDate || !reason.trim()) return
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await createDelayDraft(orderId, newExpectedDate, reason.trim())
        setIsOpen(false)
        setNewExpectedDate('')
        setReason('')
        router.refresh()
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : '遅延通知の作成に失敗しました。')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-11 rounded-md border border-amber-300 px-4 text-sm font-medium text-amber-800"
      >
        遅延通知を作成
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <p className="mb-3 text-sm font-medium text-gray-900">遅延通知メールのドラフトを作成します</p>

            <label className="mb-1 block text-xs font-medium text-gray-600">新しいお届け予定日</label>
            <input
              type="date"
              value={newExpectedDate}
              onChange={(e) => setNewExpectedDate(e.target.value)}
              className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            <label className="mb-1 block text-xs font-medium text-gray-600">理由</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="遅延の理由を入力してください"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm"
              >
                やめる
              </button>
              <button
                type="button"
                disabled={isPending || !newExpectedDate || !reason.trim()}
                onClick={handleSubmit}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {isPending ? '作成中...' : 'ドラフト作成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
