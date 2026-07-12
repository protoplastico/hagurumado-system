import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getOrderAcceptanceStatus } from '@/lib/domain/store-status'
import { getFeaturedActiveProducts } from '@/lib/domain/store-products'
import { formatPrice, getPriceForLocale } from '@/lib/domain/pricing'
import { OrderStatusBanner } from './_components/order-status-banner'

export const dynamic = 'force-dynamic'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  return {
    title: dict.common.siteName,
    description: dict.home.brandStatement,
  }
}

export default async function StoreHomePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const supabase = createClient()

  const [status, products] = await Promise.all([
    getOrderAcceptanceStatus(supabase),
    getFeaturedActiveProducts(supabase),
  ])

  return (
    <div>
      <OrderStatusBanner locale={locale} status={status} />

      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold leading-relaxed text-sumi sm:text-3xl">
          {dict.home.brandStatement}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-sumi/70">{dict.home.brandSubtext}</p>
        <Link
          href={`/${locale}/products`}
          className="mt-8 inline-block rounded-sm border border-sumi/30 px-6 py-3 text-sm text-sumi transition-colors hover:border-accent hover:text-accent"
        >
          {dict.home.ctaShop}
        </Link>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="mb-6 text-center text-lg font-semibold text-sumi">{dict.home.featuredHeading}</h2>
        {products.length === 0 ? (
          <p className="text-center text-sm text-sumi/60">{dict.home.noProducts}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {products.map((product) => {
              const name = locale === 'ja' ? product.name_ja : product.name_en
              const woodSpecies = locale === 'ja' ? product.wood_species_ja : product.wood_species_en
              return (
                <Link
                  key={product.code}
                  href={`/${locale}/products/${product.code}`}
                  className="block rounded-sm border border-sumi/10 bg-kinari-light p-4 transition-colors hover:border-accent"
                >
                  <p className="text-sm font-medium text-sumi">{name}</p>
                  {woodSpecies && <p className="mt-1 text-xs text-sumi/60">{woodSpecies}</p>}
                  <p className="mt-2 text-sm text-accent">{formatPrice(getPriceForLocale(product, locale), locale)}</p>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
