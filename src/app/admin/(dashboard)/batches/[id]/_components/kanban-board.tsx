'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { advanceBatchStepAction, returnItemToQueueAction } from '../../actions'

export type ProductionStep = {
  step_no: number
  name_ja: string
  name_en: string | null
  scope: string
  is_custom_extra: boolean
}

export type BatchItem = {
  id: string
  order_id: string
  line_no: number
  product_name: string
  variation_name: string
  wood_species: string | null
  maker: string | null
  options_snapshot: { group: string; value: string; delta?: number }[] | null
  custom_note: string | null
  production_status: string
  is_custom_order: boolean
}

export type Batch = {
  id: string
  batch_number: string
  wood_species: string | null
  status: string
  current_step: number | null
  is_custom: boolean
  started_at: string | null
  completed_at: string | null
}

// fn_advance_batch_step(TASK-03)側も工程7到達で一括inspected化する前提でハードコードしているため、
// フロント側の「検品チェック」判定もここに合わせる。
const INSPECTION_STEP_NO = 7

export function KanbanBoard({ batch, items, steps }: { batch: Batch; items: BatchItem[]; steps: ProductionStep[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [returnTarget, setReturnTarget] = useState<BatchItem | null>(null)
  const [returnReason, setReturnReason] = useState('')

  const isAtInspection = batch.status === 'in_progress' && batch.current_step === INSPECTION_STEP_NO
  const allChecked = isAtInspection && items.length > 0 && items.every((item) => checkedIds.has(item.id))

  function toggleChecked(itemId: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function handleAdvance() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await advanceBatchStepAction(batch.id)
        setConfirmOpen(false)
        setCheckedIds(new Set())
        router.refresh()
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : '工程を進められませんでした。')
      }
    })
  }

  function handleReturnSubmit() {
    if (!returnTarget || !returnReason.trim()) return
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await returnItemToQueueAction(returnTarget.id, returnReason.trim())
        setReturnTarget(null)
        setReturnReason('')
        router.refresh()
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : '差戻しに失敗しました。')
      }
    })
  }

  const advanceLabel = batch.status !== 'in_progress' ? null : isAtInspection ? 'バッチ完了' : '次工程へ'

  const nextStepName = (() => {
    if (batch.current_step == null) return null
    const idx = steps.findIndex((s) => s.step_no === batch.current_step)
    return steps[idx + 1]?.name_ja ?? null
  })()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{batch.batch_number}</h1>
          <p className="text-sm text-gray-500">
            {batch.wood_species ?? '-'} ・ {items.length}本 ・ {batch.status}
            {batch.is_custom && ' ・ オーダーメイド'}
          </p>
        </div>
        {advanceLabel && (
          <button
            type="button"
            disabled={isPending || (isAtInspection && !allChecked)}
            onClick={() => setConfirmOpen(true)}
            className="h-14 rounded-md bg-gray-900 px-6 text-base font-medium text-white disabled:opacity-40"
          >
            {advanceLabel}
          </button>
        )}
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {/* 工程1〜7(+オーダーメイド追加工程)の横スクロール列。現工程をハイライト。 */}
      <div className="overflow-x-auto">
        <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
          {steps.map((step) => {
            const isCurrent = step.step_no === batch.current_step
            const isPast = batch.current_step != null && step.step_no < batch.current_step
            return (
              <div
                key={step.step_no}
                className={`w-32 shrink-0 rounded-lg border p-3 text-center ${
                  isCurrent
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : isPast
                      ? 'border-gray-200 bg-gray-100 text-gray-400'
                      : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <p className="text-xs">工程{step.step_no}</p>
                <p className="mt-1 text-sm font-medium">{step.name_ja}</p>
              </div>
            )
          })}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          アイテム一覧({items.length}本)
          {isAtInspection && <span className="ml-2 text-sm font-normal text-gray-500">検品チェック</span>}
        </h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <label className="flex flex-1 cursor-pointer items-start gap-3">
                  {isAtInspection && (
                    <input
                      type="checkbox"
                      checked={checkedIds.has(item.id)}
                      onChange={() => toggleChecked(item.id)}
                      className="mt-1 h-6 w-6 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {item.product_name} / {item.variation_name}
                      {item.is_custom_order && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          オーダーメイド
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      樹種: {item.wood_species ?? '-'} ・ メーカー: {item.maker ?? '-'}
                    </p>
                    {Array.isArray(item.options_snapshot) && item.options_snapshot.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-sm text-gray-600">
                        {item.options_snapshot.map((opt, idx) => (
                          <li key={idx}>
                            {opt.group}: {opt.value}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.custom_note && <p className="mt-1 text-sm text-gray-600">特記: {item.custom_note}</p>}
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => setReturnTarget(item)}
                  className="h-11 shrink-0 rounded-md border border-red-300 px-4 text-sm font-medium text-red-700"
                >
                  差戻し
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {confirmOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <p className="mb-4 text-sm text-gray-700">
              {isAtInspection
                ? 'バッチを完了し、全アイテムを検品済にします。よろしいですか？'
                : `工程を「${nextStepName ?? ''}」に進めます。よろしいですか？`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm"
              >
                やめる
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleAdvance}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                実行する
              </button>
            </div>
          </div>
        </div>
      )}

      {returnTarget && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <p className="mb-2 text-sm font-medium text-gray-900">
              {returnTarget.product_name} / {returnTarget.variation_name} を差戻します
            </p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="差戻し理由を入力してください"
              rows={3}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReturnTarget(null)
                  setReturnReason('')
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm"
              >
                やめる
              </button>
              <button
                type="button"
                disabled={isPending || !returnReason.trim()}
                onClick={handleReturnSubmit}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                差戻す
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
