'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateShippingRate } from '../actions'

export type ShippingRateRow = { id: string; region_group: string; name_ja: string; countries: string[]; fee: number }

// TASK-21: 海外送料(仮データ)の編集UI。正式な地域区分・金額の確定待ちにつき、
// 対象国コード(ISO 3166-1 alpha-2、カンマ区切り)と金額のみ編集可能にする。
export function ShippingRatesEditor({ rows }: { rows: ShippingRateRow[] }) {
  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">海外送料(地域区分別)</h2>
        <p className="mt-1 text-sm text-gray-500">
          仮データです。正式な地域区分・金額が確定次第、ここから更新してください。対象国はISO
          3166-1 alpha-2コードをカンマ区切りで入力します。
        </p>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <ShippingRateFields key={row.id} row={row} />
        ))}
      </div>
    </section>
  )
}

function ShippingRateFields({ row }: { row: ShippingRateRow }) {
  const [fee, setFee] = useState(String(row.fee))
  const [countries, setCountries] = useState(row.countries.join(','))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  function handleSave() {
    const feeValue = Number(fee.trim())
    if (Number.isNaN(feeValue)) return
    const countryList = countries
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
    if (countryList.length === 0) return

    startTransition(async () => {
      await updateShippingRate(row.id, feeValue, countryList)
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <div className="grid grid-cols-1 items-end gap-3 border-t border-gray-100 pt-3 first:border-t-0 first:pt-0 sm:grid-cols-[8rem_1fr_8rem_auto]">
      <div className="text-sm font-medium text-gray-900">{row.name_ja}</div>
      <label className="text-xs text-gray-500">
        対象国コード
        <input
          type="text"
          value={countries}
          onChange={(e) => setCountries(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
        />
      </label>
      <label className="text-xs text-gray-500">
        送料(円)
        <input
          type="number"
          step="1"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
        />
      </label>
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded bg-gray-900 px-3 py-1 text-sm text-white disabled:opacity-40"
      >
        {saved ? '保存済' : '保存'}
      </button>
    </div>
  )
}
