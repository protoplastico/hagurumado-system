import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductList, type ProductListRow } from './_components/product-list'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const supabase = createAdminClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('id, code, series, name_ja, wood_species_ja, price_domestic, price_international, is_active, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw error

  const { data: variations } = await supabase.from('variations').select('product_id')
  const variationCounts = new Map<string, number>()
  for (const row of (variations ?? []) as { product_id: string }[]) {
    variationCounts.set(row.product_id, (variationCounts.get(row.product_id) ?? 0) + 1)
  }

  const rows: ProductListRow[] = (products ?? []).map((p) => ({
    id: p.id as string,
    code: p.code as string,
    series: p.series as string,
    name_ja: p.name_ja as string,
    wood_species_ja: p.wood_species_ja as string | null,
    price_domestic: p.price_domestic as number,
    price_international: p.price_international as number,
    is_active: p.is_active as boolean,
    sort_order: p.sort_order as number,
    variationCount: variationCounts.get(p.id as string) ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/products/option-groups"
            className="flex h-11 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700"
          >
            オプショングループ管理
          </Link>
          <Link
            href="/admin/products/new"
            className="flex h-11 items-center rounded-md bg-gray-900 px-4 text-sm font-medium text-white"
          >
            新規商品作成
          </Link>
        </div>
      </div>
      <ProductList products={rows} />
    </div>
  )
}
