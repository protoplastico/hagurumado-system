'use client'

import { useState, useTransition } from 'react'
import { PRODUCT_SERIES_LABELS, PRODUCT_SERIES_VALUES } from '@/lib/domain/enums'
import type { ProductInput } from '../actions'

export function ProductForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial: ProductInput
  onSubmit: (input: ProductInput) => Promise<void>
  submitLabel: string
}) {
  const [form, setForm] = useState<ProductInput>(initial)
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
          <label className="mb-1 block text-sm font-medium text-gray-700">商品コード</label>
          <input
            type="text"
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">シリーズ</label>
          <select
            value={form.series}
            onChange={(e) => setForm((f) => ({ ...f, series: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {PRODUCT_SERIES_VALUES.map((s) => (
              <option key={s} value={s}>
                {PRODUCT_SERIES_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">商品名(日本語)</label>
          <input
            type="text"
            required
            value={form.name_ja}
            onChange={(e) => setForm((f) => ({ ...f, name_ja: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">商品名(英語)</label>
          <input
            type="text"
            required
            value={form.name_en}
            onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">樹種(日本語)</label>
          <input
            type="text"
            value={form.wood_species_ja}
            onChange={(e) => setForm((f) => ({ ...f, wood_species_ja: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">樹種(英語)</label>
          <input
            type="text"
            value={form.wood_species_en}
            onChange={(e) => setForm((f) => ({ ...f, wood_species_en: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">国内価格(円)</label>
          <input
            type="number"
            required
            value={form.price_domestic}
            onChange={(e) => setForm((f) => ({ ...f, price_domestic: Number(e.target.value) }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">海外価格(円)</label>
          <input
            type="number"
            required
            value={form.price_international}
            onChange={(e) => setForm((f) => ({ ...f, price_international: Number(e.target.value) }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">並び順</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 pt-6 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.is_custom_order}
            onChange={(e) => setForm((f) => ({ ...f, is_custom_order: e.target.checked }))}
          />
          フルオーダーメイド枠
        </label>
        <label className="flex items-center gap-2 pt-6 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          公開する
        </label>
      </div>

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
