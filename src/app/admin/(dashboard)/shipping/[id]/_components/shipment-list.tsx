'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  buildClickpostRows,
  buildEmsRows,
  rowsToCsvText,
  csvTextToBlob,
  EMS_HEADER_ROW,
} from '@/lib/domain/shipping-labels'
import type { Carrier } from '@/lib/domain/shipping'
import { markShipmentShipped } from '../actions'

export type ShipmentRow = {
  shipmentId: string
  orderId: string
  orderNumber: string
  shipName: string
  shipPostal: string
  shipAddress1: string
  shipAddress2: string | null
  shipCountry: string | null
  shipPhone: string | null
  region: 'domestic' | 'international'
  carrier: Carrier | null
  trackingNumber: string | null
  shippedAt: string | null
}

const CARRIER_LABELS: Record<Carrier, string> = { clickpost: 'クリックポスト', ems: 'EMS', other: 'その他' }

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ShipmentList({ batchId, batchStatus, shipments }: {
  batchId: string
  batchStatus: string
  shipments: ShipmentRow[]
}) {
  const [encoding, setEncoding] = useState<'shift-jis' | 'utf-8'>('shift-jis')
  const router = useRouter()

  const domesticOrders = shipments.filter((s) => s.region === 'domestic' && !s.shippedAt)
  const internationalOrders = shipments.filter((s) => s.region === 'international' && !s.shippedAt)

  function downloadClickpostCsv() {
    const rows = buildClickpostRows(
      domesticOrders.map((s) => ({
        orderNumber: s.orderNumber,
        shipName: s.shipName,
        shipPostal: s.shipPostal,
        shipAddress1: s.shipAddress1,
        shipAddress2: s.shipAddress2,
      }))
    )
    const text = rowsToCsvText(rows)
    downloadBlob(csvTextToBlob(text, encoding), `clickpost_${batchId}.csv`)
  }

  function downloadEmsCsv() {
    const rows = [
      EMS_HEADER_ROW,
      ...buildEmsRows(
        internationalOrders.map((s) => ({
          orderNumber: s.orderNumber,
          shipName: s.shipName,
          shipPostal: s.shipPostal,
          shipAddress1: s.shipAddress1,
          shipAddress2: s.shipAddress2,
          shipCountry: s.shipCountry,
          shipPhone: s.shipPhone,
        }))
      ),
    ]
    const text = rowsToCsvText(rows)
    downloadBlob(csvTextToBlob(text, encoding), `ems_${batchId}.csv`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">文字コード</label>
          <select
            value={encoding}
            onChange={(e) => setEncoding(e.target.value as 'shift-jis' | 'utf-8')}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="shift-jis">Shift-JIS</option>
            <option value="utf-8">UTF-8</option>
          </select>
        </div>
        <button
          type="button"
          disabled={domesticOrders.length === 0}
          onClick={downloadClickpostCsv}
          className="h-11 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 disabled:opacity-40"
        >
          クリックポストCSV(国内・{domesticOrders.length}件)
        </button>
        <button
          type="button"
          disabled={internationalOrders.length === 0}
          onClick={downloadEmsCsv}
          className="h-11 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 disabled:opacity-40"
        >
          EMS一覧CSV(海外・{internationalOrders.length}件)
        </button>
      </div>

      <div className="space-y-2">
        {shipments.map((shipment) => (
          <ShipmentRowItem key={shipment.shipmentId} batchId={batchId} shipment={shipment} onDone={() => router.refresh()} />
        ))}
      </div>

      {batchStatus === 'shipped' && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          全件の伝票番号登録が完了し、発送バッチは発送済みになりました。
        </p>
      )}
    </div>
  )
}

function ShipmentRowItem({
  batchId,
  shipment,
  onDone,
}: {
  batchId: string
  shipment: ShipmentRow
  onDone: () => void
}) {
  const [carrier, setCarrier] = useState<Carrier>(
    shipment.carrier ?? (shipment.region === 'domestic' ? 'clickpost' : 'ems')
  )
  const [trackingNumber, setTrackingNumber] = useState(shipment.trackingNumber ?? '')
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isShipped = Boolean(shipment.shippedAt)

  function handleSubmit() {
    if (!trackingNumber.trim()) return
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await markShipmentShipped(batchId, shipment.shipmentId, carrier, trackingNumber.trim())
        onDone()
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : '登録に失敗しました。')
      }
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-medium text-gray-900">{shipment.orderNumber}</span>
          <span className="ml-2 text-sm text-gray-500">{shipment.shipName}</span>
        </div>
        {isShipped && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">発送済み</span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {shipment.shipPostal} {shipment.shipAddress1} {shipment.shipAddress2}
      </p>

      {isShipped ? (
        <p className="mt-2 text-sm text-gray-600">
          {CARRIER_LABELS[shipment.carrier ?? 'other']} ・ {shipment.trackingNumber}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value as Carrier)}
            className="h-11 rounded-md border border-gray-300 px-3 text-sm"
          >
            <option value="clickpost">クリックポスト</option>
            <option value="ems">EMS</option>
            <option value="other">その他</option>
          </select>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="伝票番号(追跡番号)"
            className="h-11 flex-1 rounded-md border border-gray-300 px-3 text-sm"
          />
          <button
            type="button"
            disabled={isPending || !trackingNumber.trim()}
            onClick={handleSubmit}
            className="h-11 rounded-md bg-gray-900 px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? '登録中...' : '登録'}
          </button>
        </div>
      )}
      {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
    </div>
  )
}
