'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { retryFailedEmail } from '../actions'

export type HistoryEmail = {
  id: string
  orderNumber: string | null
  recipientEmail: string | null
  type: string
  status: string
  subject: string
  sentAt: string | null
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

const STATUS_LABELS: Record<string, string> = {
  approved: '承認済(送信待ち)',
  sent: '送信済み',
  failed: '失敗',
  discarded: '破棄済み',
}

export function HistoryList({ emails, defaultQuery }: { emails: HistoryEmail[]; defaultQuery?: string }) {
  return (
    <div className="space-y-4">
      <form method="get" className="flex gap-2">
        <input type="hidden" name="tab" value="history" />
        <input
          type="text"
          name="q"
          defaultValue={defaultQuery}
          placeholder="注文番号・宛先・種別で検索"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="h-11 rounded-md bg-gray-900 px-4 text-sm font-medium text-white">
          検索
        </button>
      </form>

      {emails.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          該当するメールはありません。
        </p>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <HistoryItem key={email.id} email={email} />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryItem({ email }: { email: HistoryEmail }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleRetry() {
    startTransition(async () => {
      await retryFailedEmail(email.id)
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-gray-900">{email.subject}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            email.status === 'failed'
              ? 'bg-red-100 text-red-800'
              : email.status === 'sent'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {STATUS_LABELS[email.status] ?? email.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {email.orderNumber ?? '-'} ・ {email.recipientEmail ?? '-'} ・ {TYPE_LABELS[email.type] ?? email.type}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {email.sentAt
          ? `送信: ${new Date(email.sentAt).toLocaleString('ja-JP')}`
          : `作成: ${new Date(email.createdAt).toLocaleString('ja-JP')}`}
      </p>
      {email.status === 'failed' && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleRetry}
          className="mt-2 h-11 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          {isPending ? '再送中...' : '再送する'}
        </button>
      )}
    </div>
  )
}
