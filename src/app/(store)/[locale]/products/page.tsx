import { createClient } from '@/lib/supabase/server'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getFilteredProducts } from '@/lib/domain/store-products'
import { getOrderAcceptanceStatus } from '@/lib/domain/store-status'
import { absoluteUrl, localizedAlternates } from '@/lib/seo'
import { WaitWeeksNotice } from '../_components/wait-weeks-notice'
import { ProductFilters } from './_components/product-filters'
import { ProductCard } from './_components/product-card'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function param(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key]
  return Array.isArray(value) ? value[0] : value
}

// フィルタ条件(searchParams)違いは正規URLをフィルタなしの一覧トップに統一する
// (重複コンテンツ化を避けるため、canonicalは常に/productsを指す)。
export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const description = dict.seo.productListDescription
  return {
    title: dict.productList.heading,
    description,
    alternates: localizedAlternates(locale, '/products'),
    openGraph: { title: dict.productList.heading, description, url: absoluteUrl(`/${locale}/products`), type: 'website' },
    twitter: { card: 'summary', title: dict.productList.heading, description },
  }
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

  const [products, status] = await Promise.all([
    getFilteredProducts(supabase, {
      maker: maker || undefined,
      series: series || undefined,
      minPrice: minPrice != null && !Number.isNaN(minPrice) ? minPrice : undefined,
      maxPrice: maxPrice != null && !Number.isNaN(maxPrice) ? maxPrice : undefined,
      locale,
    }),
    getOrderAcceptanceStatus(supabase),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold text-sumi">{dict.productList.heading}</h1>
      <WaitWeeksNotice locale={locale} estimatedWaitWeeks={status.estimatedWaitWeeks} className="mb-6 text-xs text-sumi/60" />

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
