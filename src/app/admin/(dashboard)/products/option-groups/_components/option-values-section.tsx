'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createOptionValue, deleteOptionValue, updateOptionValue, type OptionValueInput } from '../actions'

export type OptionValueRow = {
  id: string
  name_ja: string
  name_en: string
  price_delta_domestic: number
  price_delta_international: number
  requires_note: boolean
  sort_order: number
  is_active: boolean
}

const EMPTY_INPUT: OptionValueInput = {
  name_ja: '',
  name_en: '',
  price_delta_domestic: 0,
  price_delta_international: 0,
  requires_note: false,
  sort_order: 0,
  is_active: true,
}

export function OptionValuesSection({ groupId, values }: { groupId: string; values: OptionValueRow[] }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">
        並び順を変更して保存すると、フロントの選択肢の表示順に反映されます。単価差分は既存注文には影響しません(注文明細はスナップショット保存のため)。
      </p>
      {values.length === 0 && <p className="text-sm text-gray-500">選択肢が登録されていません。</p>}
      {values.map((v) => (
        <OptionValueRowForm key={v.id} groupId={groupId} value={v} />
      ))}
      <OptionValueCreateForm groupId={groupId} />
    </div>
  )
}

function OptionValueRowForm({ groupId, value }: { groupId: string; value: OptionValueRow }) {
  const [form, setForm] = useState<OptionValueInput>({
    name_ja: value.name_ja,
    name_en: value.name_en,
    price_delta_domestic: value.price_delta_domestic,
    price_delta_international: value.price_delta_international,
    requires_note: value.requires_note,
    sort_order: value.sort_order,
    is_active: value.is_active,
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  function handleSave() {
    startTransition(async () => {
      await updateOptionValue(groupId, value.id, form)
      setSaved(true)
      setTimeout(() => setSaved(false), 1200)
    })
  }

  function handleDelete() {
    if (!confirm(`「${value.name_ja}」を削除しますか?`)) return
    startTransition(async () => {
      await deleteOptionValue(groupId, value.id)
      router.refresh()
    })
  }

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-12 sm:items-center">
      <input
        type="text"
        value={form.name_ja}
        onChange={(e) => setForm((f) => ({ ...f, name_ja: e.target.value }))}
        placeholder="選択肢名(日本語)"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-3"
      />
      <input
        type="text"
        value={form.name_en}
        onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
        placeholder="選択肢名(英語)"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-3"
      />
      <input
        type="number"
        value={form.price_delta_domestic}
        onChange={(e) => setForm((f) => ({ ...f, price_delta_domestic: Number(e.target.value) }))}
        placeholder="国内差分"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-2"
      />
      <input
        type="number"
        value={form.price_delta_international}
        onChange={(e) => setForm((f) => ({ ...f, price_delta_international: Number(e.target.value) }))}
        placeholder="海外差分"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-2"
      />
      <input
        type="number"
        value={form.sort_order}
        onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
        className="w-16 rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-1"
      />
      <label className="flex items-center gap-1 text-xs text-gray-600 sm:col-span-1">
        <input
          type="checkbox"
          checked={form.requires_note}
          onChange={(e) => setForm((f) => ({ ...f, requires_note: e.target.checked }))}
        />
        自由記述
      </label>
      <div className="flex items-center gap-2 sm:col-span-12 sm:justify-end">
        <label className="flex items-center gap-1 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          有効
        </label>
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

function OptionValueCreateForm({ groupId }: { groupId: string }) {
  const [form, setForm] = useState<OptionValueInput>(EMPTY_INPUT)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate() {
    if (!form.name_ja || !form.name_en) return
    startTransition(async () => {
      await createOptionValue(groupId, form)
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
        placeholder="選択肢名(日本語)"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-3"
      />
      <input
        type="text"
        value={form.name_en}
        onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
        placeholder="選択肢名(英語)"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-3"
      />
      <input
        type="number"
        value={form.price_delta_domestic}
        onChange={(e) => setForm((f) => ({ ...f, price_delta_domestic: Number(e.target.value) }))}
        placeholder="国内差分"
        className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-2"
      />
      <input
        type="number"
        value={form.price_delta_international}
        onChange={(e) => setForm((f) => ({ ...f, price_delta_international: Number(e.target.value) }))}
        placeholder="海外差分"
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
