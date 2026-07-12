'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { assignOptionGroup, removeProductOptionGroup, updateProductOptionGroup } from '../actions'

export type AssignedOptionGroup = {
  optionGroupId: string
  name_ja: string
  is_required: boolean
  sort_order: number
}

export type AvailableOptionGroup = { id: string; name_ja: string }

export function OptionGroupAssignmentSection({
  productId,
  assigned,
  available,
}: {
  productId: string
  assigned: AssignedOptionGroup[]
  available: AvailableOptionGroup[]
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        選択肢の内容自体は
        <Link href="/admin/products/option-groups" className="underline">
          オプショングループ管理
        </Link>
        で編集します。ここではこの商品にどのグループを割り当てるかを設定します。
      </p>
      {assigned.length === 0 && <p className="text-sm text-gray-500">割り当て済みのオプショングループはありません。</p>}
      <div className="space-y-2">
        {assigned.map((a) => (
          <AssignedRow key={a.optionGroupId} productId={productId} assignment={a} />
        ))}
      </div>
      {available.length > 0 && <AssignForm productId={productId} available={available} />}
    </div>
  )
}

function AssignedRow({ productId, assignment }: { productId: string; assignment: AssignedOptionGroup }) {
  const [isRequired, setIsRequired] = useState(assignment.is_required)
  const [sortOrder, setSortOrder] = useState(assignment.sort_order)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleRequiredToggle() {
    const next = !isRequired
    setIsRequired(next)
    startTransition(async () => {
      await updateProductOptionGroup(productId, assignment.optionGroupId, { isRequired: next })
    })
  }

  function handleSortSave() {
    startTransition(async () => {
      await updateProductOptionGroup(productId, assignment.optionGroupId, { sortOrder })
    })
  }

  function handleRemove() {
    startTransition(async () => {
      await removeProductOptionGroup(productId, assignment.optionGroupId)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm">
      <span className="flex-1 font-medium text-gray-900">{assignment.name_ja}</span>
      <label className="flex items-center gap-1 text-gray-600">
        <input type="checkbox" checked={isRequired} onChange={handleRequiredToggle} disabled={isPending} />
        必須
      </label>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400">並び順</span>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-16 rounded border border-gray-300 px-2 py-1"
        />
        <button
          type="button"
          onClick={handleSortSave}
          disabled={isPending}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 disabled:opacity-40"
        >
          保存
        </button>
      </div>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 disabled:opacity-40"
      >
        割当解除
      </button>
    </div>
  )
}

function AssignForm({ productId, available }: { productId: string; available: AvailableOptionGroup[] }) {
  const [groupId, setGroupId] = useState(available[0]?.id ?? '')
  const [isRequired, setIsRequired] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAssign() {
    if (!groupId) return
    startTransition(async () => {
      await assignOptionGroup(productId, groupId, isRequired, sortOrder)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-gray-300 p-3 text-sm">
      <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="rounded border border-gray-300 px-2 py-1">
        {available.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name_ja}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-gray-600">
        <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
        必須
      </label>
      <input
        type="number"
        value={sortOrder}
        onChange={(e) => setSortOrder(Number(e.target.value))}
        placeholder="並び順"
        className="w-16 rounded border border-gray-300 px-2 py-1"
      />
      <button
        type="button"
        onClick={handleAssign}
        disabled={isPending}
        className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
      >
        割り当てる
      </button>
    </div>
  )
}
