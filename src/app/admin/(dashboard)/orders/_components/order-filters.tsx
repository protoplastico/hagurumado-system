import {
  PAYMENT_STATUS_VALUES,
  PAYMENT_STATUS_LABELS,
  REGION_VALUES,
  REGION_LABELS,
  PEN_MAKER_VALUES,
  ORDER_SOURCE_VALUES,
  ORDER_SOURCE_LABELS,
} from '@/lib/domain/enums'
import { PRODUCTION_STATUS_VALUES, PRODUCTION_STATUS_LABELS_ADMIN } from '@/lib/domain/production-status'

type Props = {
  defaults: {
    q?: string
    payment_status?: string
    production_status?: string
    wood_species?: string
    maker?: string
    region?: string
    source?: string
    date_from?: string
    date_to?: string
  }
  woodSpeciesOptions: string[]
}

// GETフォームのみでフィルタを実現(JS不要、URLのsearchParamsをそのままServer Componentで読む)
export function OrderFilters({ defaults, woodSpeciesOptions }: Props) {
  return (
    <form method="get" className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <label className="mb-1 block text-xs font-medium text-gray-600">検索(注文番号/顧客名)</label>
        <input
          type="text"
          name="q"
          defaultValue={defaults.q}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <SelectField
        label="決済ステータス"
        name="payment_status"
        defaultValue={defaults.payment_status}
        options={PAYMENT_STATUS_VALUES.map((v) => ({ value: v, label: PAYMENT_STATUS_LABELS[v] }))}
      />

      <SelectField
        label="生産ステータス"
        name="production_status"
        defaultValue={defaults.production_status}
        options={PRODUCTION_STATUS_VALUES.map((v) => ({ value: v, label: PRODUCTION_STATUS_LABELS_ADMIN[v] }))}
      />

      <SelectField
        label="樹種"
        name="wood_species"
        defaultValue={defaults.wood_species}
        options={woodSpeciesOptions.map((v) => ({ value: v, label: v }))}
      />

      <SelectField
        label="機種メーカー"
        name="maker"
        defaultValue={defaults.maker}
        options={PEN_MAKER_VALUES.map((v) => ({ value: v, label: v }))}
      />

      <SelectField
        label="国内/海外"
        name="region"
        defaultValue={defaults.region}
        options={REGION_VALUES.map((v) => ({ value: v, label: REGION_LABELS[v] }))}
      />

      <SelectField
        label="注文元"
        name="source"
        defaultValue={defaults.source}
        options={ORDER_SOURCE_VALUES.map((v) => ({ value: v, label: ORDER_SOURCE_LABELS[v] }))}
      />

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">期間(from)</label>
        <input
          type="date"
          name="date_from"
          defaultValue={defaults.date_from}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">期間(to)</label>
        <input
          type="date"
          name="date_to"
          defaultValue={defaults.date_to}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-end gap-2 lg:col-span-1">
        <button type="submit" className="h-11 flex-1 rounded-md bg-gray-900 px-4 text-sm font-medium text-white">
          検索
        </button>
        <a
          href="/admin/orders"
          className="flex h-11 flex-1 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700"
        >
          クリア
        </a>
      </div>
    </form>
  )
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string
  name: string
  defaultValue?: string
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">すべて</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
