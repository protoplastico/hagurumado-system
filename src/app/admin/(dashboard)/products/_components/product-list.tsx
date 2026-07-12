'use client'

import Link from 'next/link'
import { PRODUCT_SERIES_LABELS } from '@/lib/domain/enums'
import { toggleProductActive } from '../actions'
import { ToggleSwitch } from './toggle-switch'

export type ProductListRow = {
  id: string
  code: string
  series: string
  name_ja: string
  wood_species_ja: string | null
  price_domestic: number
  price_international: number
  is_active: boolean
  sort_order: number
  variationCount: number
}

export function ProductList({ products }: { products: ProductListRow[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        商品が登録されていません。
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
          <tr>
            <th className="px-4 py-3">商品名</th>
            <th className="px-4 py-3">シリーズ</th>
            <th className="px-4 py-3">樹種</th>
            <th className="px-4 py-3">国内価格</th>
            <th className="px-4 py-3">海外価格</th>
            <th className="px-4 py-3">機種数</th>
            <th className="px-4 py-3">並び順</th>
            <th className="px-4 py-3">公開</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link href={`/admin/products/${p.id}`} className="font-medium text-gray-900 underline">
                  {p.name_ja}
                </Link>
                <p className="text-xs text-gray-400">{p.code}</p>
              </td>
              <td className="px-4 py-3 text-gray-700">{PRODUCT_SERIES_LABELS[p.series] ?? p.series}</td>
              <td className="px-4 py-3 text-gray-700">{p.wood_species_ja ?? '-'}</td>
              <td className="px-4 py-3 text-gray-700">¥{p.price_domestic.toLocaleString()}</td>
              <td className="px-4 py-3 text-gray-700">¥{p.price_international.toLocaleString()}</td>
              <td className="px-4 py-3 text-gray-700">{p.variationCount}</td>
              <td className="px-4 py-3 text-gray-500">{p.sort_order}</td>
              <td className="px-4 py-3">
                <ToggleSwitch
                  initialChecked={p.is_active}
                  onToggle={(next) => toggleProductActive(p.id, next)}
                  label="公開状態"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
