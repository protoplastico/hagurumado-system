'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createShippingBatchFromPool } from '../actions'

export type PoolOrder = {
  orderId: string
  orderNumber: string
  customerName: string
  itemCount: number
  region: 'domestic' | 'international'
  inspectedAt: string | null
}

export type PartialOrder = PoolOrder & {
  inspectedCount: number
}

const REGION_LABELS: Record<string, string> = { domestic: '国内', international: '海外' }

function RegionBadge({ region }: { region: 'domestic' | 'international' }) {
  const className =
    region === 'domestic' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{REGION_LABELS[region]}</span>
}

export function ShippingPoolBoard({
  readyOrders,
  partialOrders,
  recommendedBatchSize,
}: {
  readyOrders: PoolOrder[]
  partialOrders: PartialOrder[]
  recommendedBatchSize: number
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const selectedCount = selectedIds.size

  const selectedOrderIds = useMemo(() => Array.from(selectedIds), [selectedIds])

  function toggleOrder(orderId: string) {
    setErrorMessage(null)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  function toggleSelectAll() {
    setErrorMessage(null)
    if (selectedIds.size > 0) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(readyOrders.map((o) => o.orderId)))
  }

  function handleCreateBatch() {
    if (selectedOrderIds.length === 0) return
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const batchId = await createShippingBatchFromPool(selectedOrderIds)
        router.push(`/admin/shipping/${batchId}`)
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : '発送バッチの作成に失敗しました。')
      }
    })
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex h-11 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700"
            >
              {selectedIds.size > 0 ? '選択解除' : '全選択'}
            </button>
            <span className="text-sm text-gray-600">
              選択中: {selectedCount}件
              {selectedCount > recommendedBatchSize && (
                <span className="ml-2 font-medium text-amber-600">推奨{recommendedBatchSize}件を超えています</span>
              )}
            </span>
          </div>
          <button
            type="button"
            disabled={selectedCount === 0 || isPending}
            onClick={handleCreateBatch}
            className="h-11 rounded-md bg-gray-900 px-5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? '作成中...' : '発送バッチ作成'}
          </button>
        </div>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <h2 className="text-lg font-semibold text-gray-900">発送可能({readyOrders.length}件)</h2>
        {readyOrders.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            発送可能な注文はありません。
          </p>
        ) : (
          <div className="space-y-2">
            {readyOrders.map((order) => (
              <label
                key={order.orderId}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.orderId)}
                  onChange={() => toggleOrder(order.orderId)}
                  className="mt-1 h-6 w-6 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">{order.orderNumber}</span>
                    <RegionBadge region={order.region} />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {order.customerName} ・ {order.itemCount}本
                  </p>
                  {order.inspectedAt && (
                    <p className="mt-1 text-xs text-gray-400">
                      検品完了: {new Date(order.inspectedAt).toLocaleDateString('ja-JP')}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">待ち(部分完成、{partialOrders.length}件)</h2>
        {partialOrders.length === 0 ? (
          <p className="text-sm text-gray-500">部分完成の注文はありません。</p>
        ) : (
          <div className="space-y-2">
            {partialOrders.map((order) => (
              <div key={order.orderId} className="rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-75">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{order.orderNumber}</span>
                  <RegionBadge region={order.region} />
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {order.customerName} ・ 検品済み {order.inspectedCount}/{order.itemCount}本
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
