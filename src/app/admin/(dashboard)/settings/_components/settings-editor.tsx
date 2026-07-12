'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateSettingValue } from '../actions'

export type SettingRow = { key: string; value: unknown; description: string | null }

const CONTROL_KEYS = ['accepting_orders_override_active', 'accepting_orders_global']

const FIELD_LABELS: Record<string, string> = {
  accepting_orders_override_active: '手動オーバーライド有効',
  accepting_orders_global: '全体受注フラグ(受付中)',
  order_stop_threshold_days: '受注自動停止閾値(日)',
  batch_size_default: 'バッチサイズ既定値(本)',
  shipping_batch_size: '発送バッチサイズ既定値(件)',
  weekly_throughput_override: '週間スループット手動上書き(本/週、空欄で実績自動算出)',
  wait_estimate_safety_margin: '推定待ち週数の安全マージン(倍率)',
  domestic_shipping_fee: '国内送料(円、クリックポスト固定)',
}

const FIELD_HINTS: Record<string, string> = {
  weekly_throughput_override:
    '稼働初期(製作実績が4週分溜まるまで)はこの値が使われます。実績が溜まったら空欄に戻し、実績算出に切り替えてください。',
}

function labelFor(row: SettingRow): string {
  return FIELD_LABELS[row.key] ?? row.key
}

export function SettingsEditor({ rows }: { rows: SettingRow[] }) {
  const controlRows = CONTROL_KEYS.map((key) => rows.find((r) => r.key === key)).filter(
    (r): r is SettingRow => r != null
  )
  const paramRows = rows.filter((r) => !CONTROL_KEYS.includes(r.key))

  const overrideActive =
    controlRows.find((r) => r.key === 'accepting_orders_override_active')?.value === true

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">受注受付の手動制御</h2>
          <p className="mt-1 text-sm text-gray-500">
            手動オーバーライドを有効にすると、閾値に基づく自動判定(毎日実行、バッチ完了時)が停止し、全体受注フラグを直接ON/OFFできます。
          </p>
        </div>
        {controlRows.map((row) => (
          <BooleanField
            key={row.key}
            settingKey={row.key}
            label={labelFor(row)}
            value={row.value === true}
            disabled={row.key === 'accepting_orders_global' && !overrideActive}
          />
        ))}
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">パラメータ</h2>
        {paramRows.map((row) => (
          <NumberField
            key={row.key}
            settingKey={row.key}
            label={labelFor(row)}
            value={row.value}
            hint={FIELD_HINTS[row.key]}
          />
        ))}
      </section>
    </div>
  )
}

function BooleanField({
  settingKey,
  label,
  value,
  disabled,
}: {
  settingKey: string
  label: string
  value: boolean
  disabled?: boolean
}) {
  const [checked, setChecked] = useState(value)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle() {
    const next = !checked
    setChecked(next)
    startTransition(async () => {
      await updateSettingValue(settingKey, next)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled || isPending}
        onClick={handleToggle}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
          checked ? 'bg-gray-900' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

function NumberField({
  settingKey,
  label,
  value,
  hint,
}: {
  settingKey: string
  label: string
  value: unknown
  hint?: string
}) {
  const isNumeric = typeof value === 'number'
  const [text, setText] = useState(isNumeric ? String(value) : '')
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  function handleSave() {
    const trimmed = text.trim()
    const next = trimmed === '' ? null : Number(trimmed)
    if (next !== null && Number.isNaN(next)) return
    startTransition(async () => {
      await updateSettingValue(settingKey, next)
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label className="text-sm font-medium text-gray-900" htmlFor={settingKey}>
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          id={settingKey}
          type="number"
          step="any"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-gray-900 px-3 py-1 text-sm text-white disabled:opacity-40"
        >
          {saved ? '保存済' : '保存'}
        </button>
      </div>
    </div>
  )
}
