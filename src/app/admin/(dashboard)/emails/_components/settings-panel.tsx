'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAutoSendSetting } from '../actions'

const EMAIL_TYPES = [
  { value: 'order_confirm', label: '注文確定' },
  { value: 'production_start', label: '製作開始' },
  { value: 'shipped', label: '発送完了' },
  { value: 'delay', label: '遅延通知' },
] as const

export function SettingsPanel({ autoSendState }: { autoSendState: Record<string, boolean> }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">
        ONにした種別は、draft作成と同時に承認不要で自動送信されます。初期値は全種別OFFです。
      </p>
      {EMAIL_TYPES.map((t) => (
        <ToggleRow key={t.value} type={t.value} label={t.label} initialEnabled={autoSendState[t.value] ?? false} />
      ))}
    </div>
  )
}

function ToggleRow({ type, label, initialEnabled }: { type: string; label: string; initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      await updateAutoSendSetting(type, next)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <span className="text-sm font-medium text-gray-900">{label}の自動送信</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={isPending}
        onClick={handleToggle}
        className={`relative h-8 w-14 rounded-full transition-colors ${enabled ? 'bg-gray-900' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
