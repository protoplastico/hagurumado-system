'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PEN_MAKER_LABELS, PEN_MAKER_VALUES } from '@/lib/domain/enums'
import {
  createVariation,
  deleteVariation,
  toggleVariationAccepting,
  updateVariation,
  type VariationInput,
} from '../actions'
import { ToggleSwitch } from './toggle-switch'

export type VariationRow = {
  id: string
  name_ja: string
  name_en: string
  maker: string
  model_code: string | null
  accepting_orders: boolean
  sort_order: number
}

const EMPTY_INPUT: VariationInput = {
  name_ja: '',
  name_en: '',
  maker: PEN_MAKER_VALUES[0],
  model_code: '',
  sort_order: 0,
}

export function VariationsSection({ productId, variations }: { productId: string; variations: VariationRow[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        受注可否トグルは材料切れ等でこの機種の受注のみを一時停止する場合に使用します。一覧表示のため複数機種をまとめて素早く操作できます。
      </p>
      {variations.length === 0 && <p className="text-sm text-gray-500">機種バリエーションが登録されていません。</p>}
      <div className="space-y-2">
        {variations.map((v) => (
          <VariationRowForm key={v.id} productId={productId} variation={v} />
        ))}
      </div>
      <VariationCreateForm productId={productId} />
    </div>
  )
}

function VariationRowForm({ productId, variation }: { productId: string; variation: VariationRow }) {
  const [form, setForm] = useState<VariationInput>({
    name_ja: variation.name_ja,
    name_en: variation.name_en,
    maker: variation.maker,
    model_code: variation.model_code ?? '',
    sort_order: variation.sort_order,
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  function handleSave() {
    startTransition(async () => {
      await updateVariation(productId, variation.id, form)
      setSaved(true)
      setTimeout(() => setSaved(false), 1200)
    })
  }

  function handleDelete() {
    if (!confirm(`「${variation.name_ja}」を削除しますか?`)) return
    startTransition(async () => {
      await deleteVariation(productId, variation.id)
      router.refresh()
    })
  }

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-12 sm:items-center">
      <input
        type="text"
        value={form.name_ja}
        onChange={(e) => setForm((f) => ({ ...f, name_ja: e.target.value }))}
        placeholder="機種名(日本語)"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-3"
      />
      <input
        type="text"
        value={form.name_en}
        onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
        placeholder="機種名(英語)"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-3"
      />
      <select
        value={form.maker}
        onChange={(e) => setForm((f) => ({ ...f, maker: e.target.value }))}
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-2"
      >
        {PEN_MAKER_VALUES.map((m) => (
          <option key={m} value={m}>
            {PEN_MAKER_LABELS[m]}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={form.model_code}
        onChange={(e) => setForm((f) => ({ ...f, model_code: e.target.value }))}
        placeholder="型番"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-2"
      />
      <input
        type="number"
        value={form.sort_order}
        onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
        className="w-16 rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-1"
      />
      <div className="flex items-center gap-2 sm:col-span-1">
        <ToggleSwitch
          initialChecked={variation.accepting_orders}
          onToggle={(next) => toggleVariationAccepting(productId, variation.id, next)}
          label="受注可否"
        />
      </div>
      <div className="flex items-center gap-2 sm:col-span-12 sm:justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 disabled:opacity-40"
        >
          {saved ? '保存済' : '保存'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded border border-red-300 px-3 py-1 text-xs text-red-700 disabled:opacity-40"
        >
          削除
        </button>
      </div>
    </div>
  )
}

function VariationCreateForm({ productId }: { productId: string }) {
  const [form, setForm] = useState<VariationInput>(EMPTY_INPUT)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate() {
    if (!form.name_ja || !form.name_en) return
    startTransition(async () => {
      await createVariation(productId, form)
      setForm(EMPTY_INPUT)
      router.refresh()
    })
  }

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-dashed border-gray-300 p-3 sm:grid-cols-12 sm:items-center">
      <input
        type="text"
        value={form.name_ja}
        onChange={(e) => setForm((f) => ({ ...f, name_ja: e.target.value }))}
        placeholder="機種名(日本語)"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-3"
      />
      <input
        type="text"
        value={form.name_en}
        onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
        placeholder="機種名(英語)"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-3"
      />
      <select
        value={form.maker}
        onChange={(e) => setForm((f) => ({ ...f, maker: e.target.value }))}
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-2"
      >
        {PEN_MAKER_VALUES.map((m) => (
          <option key={m} value={m}>
            {PEN_MAKER_LABELS[m]}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={form.model_code}
        onChange={(e) => setForm((f) => ({ ...f, model_code: e.target.value }))}
        placeholder="型番"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-2"
      />
      <input
        type="number"
        value={form.sort_order}
        onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
        className="w-16 rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-1"
      />
      <div className="sm:col-span-1">
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending}
          className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
        >
          追加
        </button>
      </div>
    </div>
  )
}
