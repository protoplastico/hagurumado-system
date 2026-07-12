'use client'

import { useState, useTransition } from 'react'
import type { OptionGroupInput } from '../actions'

export function OptionGroupForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial: OptionGroupInput
  onSubmit: (input: OptionGroupInput) => Promise<void>
  submitLabel: string
}) {
  const [form, setForm] = useState<OptionGroupInput>(initial)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await onSubmit(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">コード</label>
          <input
            type="text"
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">並び順</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">グループ名(日本語)</label>
          <input
            type="text"
            required
            value={form.name_ja}
            onChange={(e) => setForm((f) => ({ ...f, name_ja: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">グループ名(英語)</label>
          <input
            type="text"
            required
            value={form.name_en}
            onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
        />
        有効
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-md bg-gray-900 px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? '保存中...' : submitLabel}
        </button>
        {saved && <span className="text-sm text-gray-500">保存しました</span>}
      </div>
    </form>
  )
}
