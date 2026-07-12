'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveAndSendDraft, discardDraft } from '../actions'

export type PendingEmail = {
  id: string
  orderNumber: string | null
  type: string
  locale: string
  subject: string
  body: string
  aiGenerated: boolean
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  order_confirm: '注文確定',
  production_start: '製作開始',
  shipped: '発送完了',
  delay: '遅延通知',
  custom_thread: 'オーダーメイド',
  other: 'その他',
}

export function PendingList({ emails }: { emails: PendingEmail[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (emails.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        承認待ちのメールはありません。
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {emails.map((email) =>
        expandedId === email.id ? (
          <PendingEmailEditor key={email.id} email={email} onClose={() => setExpandedId(null)} />
        ) : (
          <button
            key={email.id}
            type="button"
            onClick={() => setExpandedId(email.id)}
            className="block w-full rounded-lg border border-gray-200 bg-white p-4 text-left"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-gray-900">{email.subject}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {TYPE_LABELS[email.type] ?? email.type}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {email.orderNumber ?? '-'} ・ {email.locale} ・ {email.aiGenerated ? 'AI生成' : 'テンプレート'} ・{' '}
              {new Date(email.createdAt).toLocaleString('ja-JP')}
            </p>
          </button>
        )
      )}
    </div>
  )
}

function PendingEmailEditor({ email, onClose }: { email: PendingEmail; onClose: () => void }) {
  const [subject, setSubject] = useState(email.subject)
  const [body, setBody] = useState(email.body)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  function handleApprove() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await approveAndSendDraft(email.id, subject, body)
        onClose()
        router.refresh()
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : '送信に失敗しました。')
      }
    })
  }

  function handleDiscard() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await discardDraft(email.id)
        onClose()
        router.refresh()
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : '破棄に失敗しました。')
      }
    })
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
        <span>
          {email.orderNumber ?? '-'} ・ {TYPE_LABELS[email.type] ?? email.type} ・ {email.locale}
        </span>
        <button type="button" onClick={onClose} className="text-gray-400">
          閉じる
        </button>
      </div>

      <label className="mb-1 block text-xs font-medium text-gray-600">件名</label>
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      <label className="mb-1 block text-xs font-medium text-gray-600">本文</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={10}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleDiscard}
          className="h-11 rounded-md border border-red-300 px-4 text-sm font-medium text-red-700 disabled:opacity-50"
        >
          破棄
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleApprove}
          className="h-11 rounded-md bg-gray-900 px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? '送信中...' : '承認して送信'}
        </button>
      </div>
    </div>
  )
}
