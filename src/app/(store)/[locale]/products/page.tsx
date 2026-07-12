import { createClient } from '@/lib/supabase/server'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getFilteredProducts } from '@/lib/domain/store-products'
import { ProductFilters } from './_components/product-filters'
import { ProductCard } from './_components/product-card'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function param(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key]
  return Array.isArray(value) ? value[0] : value
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  return { title: t(locale).productList.heading }
}

export default async function ProductListPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: SearchParams
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const supabase = createClient()

  const maker = param(searchParams, 'maker')
  const series = param(searchParams, 'series')
  const minPriceRaw = param(searchParams, 'minPrice')
  const maxPriceRaw = param(searchParams, 'maxPrice')
  const minPrice = minPriceRaw ? Number(minPriceRaw) : undefined
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined

  const products = await getFilteredProducts(supabase, {
    maker: maker || undefined,
    series: series || undefined,
    minPrice: minPrice != null && !Number.isNaN(minPrice) ? minPrice : undefined,
    maxPrice: maxPrice != null && !Number.isNaN(maxPrice) ? maxPrice : undefined,
    locale,
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-sumi">{dict.productList.heading}</h1>

      <ProductFilters
        locale={locale}
        defaults={{ maker, series, minPrice: minPriceRaw, maxPrice: maxPriceRaw }}
      />

      {products.length === 0 ? (
        <p className="mt-10 text-center text-sm text-sumi/60">{dict.productList.noResults}</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.code} locale={locale} product={product} supabase={supabase} />
          ))}
        </div>
      )}
    </div>
  )
}
