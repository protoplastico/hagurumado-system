'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBatchFromQueue } from '../actions'

export type QueueItem = {
  order_item_id: string
  order_id: string
  wood_species: string | null
  production_status: string
  ordered_at: string
  wood_species_backlog_count: number
  order_number: string
  product_name: string
  variation_name: string
  maker: string | null
  options_snapshot: { group: string; value: string; delta?: number }[] | null
  custom_note: string | null
  is_custom_order: boolean
}

function summarizeSpec(item: QueueItem): string {
  const parts = [item.variation_name]
  if (Array.isArray(item.options_snapshot)) {
    for (const opt of item.options_snapshot.slice(0, 2)) {
      parts.push(opt.value)
    }
  }
  return parts.filter(Boolean).join(' / ')
}

function elapsedDays(orderedAt: string): number {
  return Math.floor((Date.now() - new Date(orderedAt).getTime()) / (1000 * 60 * 60 * 24))
}

export function QueueBoard({
  items,
  recommendedBatchSize,
  selectedWoodSpecies,
}: {
  items: QueueItem[]
  recommendedBatchSize: number
  selectedWoodSpecies?: string
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.order_item_id)),
    [items, selectedIds]
  )
  const hasCustomSelected = selectedItems.some((item) => item.is_custom_order)
  const selectedWoodSpeciesSet = new Set(selectedItems.map((item) => item.wood_species))

  function toggleItem(item: QueueItem) {
    setErrorMessage(null)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(item.order_item_id)) {
        next.delete(item.order_item_id)
        return next
      }
      // オーダーメイドは単独バッチのみ許可のため、選択すると他の選択はクリアする
      if (item.is_custom_order || hasCustomSelected) {
        return new Set([item.order_item_id])
      }
      next.add(item.order_item_id)
      return next
    })
  }

  function toggleSelectAll() {
    setErrorMessage(null)
    if (selectedIds.size > 0) {
      setSelectedIds(new Set())
      return
    }
    const nonCustomItems = items.filter((item) => !item.is_custom_order)
    setSelectedIds(new Set(nonCustomItems.map((item) => item.order_item_id)))
  }

  function handleCreateBatch() {
    if (selectedItems.length === 0) return
    if (selectedWoodSpeciesSet.size > 1) {
      setErrorMessage('複数の樹種が混在しています。同一樹種のみ選択してください。')
      return
    }
    const woodSpecies = selectedItems[0].wood_species
    if (!woodSpecies) {
      setErrorMessage('樹種未設定のアイテムは含められません。')
      return
    }

    setErrorMessage(null)
    startTransition(async () => {
      try {
        const batchId = await createBatchFromQueue(
          woodSpecies,
          selectedItems.map((item) => item.order_item_id)
        )
        router.push(`/admin/batches/${batchId}`)
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'バッチ作成に失敗しました。')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex h-11 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700"
          >
            {selectedIds.size > 0 ? '選択解除' : `全選択${selectedWoodSpecies ? `(${selectedWoodSpecies})` : ''}`}
          </button>
          <span className="text-sm text-gray-600">
            選択中: {selectedItems.length}本
            {selectedItems.length > recommendedBatchSize && (
              <span className="ml-2 font-medium text-amber-600">推奨{recommendedBatchSize}本を超えています</span>
            )}
          </span>
        </div>
        <button
          type="button"
          disabled={selectedItems.length === 0 || isPending}
          onClick={handleCreateBatch}
          className="h-11 rounded-md bg-gray-900 px-5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? '作成中...' : 'バッチ作成'}
        </button>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          キューにアイテムがありません。
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <label
              key={item.order_item_id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(item.order_item_id)}
                onChange={() => toggleItem(item)}
                className="mt-1 h-6 w-6 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{item.order_number}</span>
                  {item.is_custom_order && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      オーダーメイド
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {item.wood_species ?? '(樹種未設定)'} ・ {summarizeSpec(item)}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  受注日 {new Date(item.ordered_at).toLocaleDateString('ja-JP')} ・ 経過
                  {elapsedDays(item.ordered_at)}日
                </p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
