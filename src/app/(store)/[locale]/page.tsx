import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getOrderAcceptanceStatus } from '@/lib/domain/store-status'
import { getFeaturedActiveProducts } from '@/lib/domain/store-products'
import { getProductionStepNames } from '@/lib/domain/store-craft-process'
import { formatPrice, getPriceForLocale } from '@/lib/domain/pricing'
import { getSiteSettings } from '@/lib/sanity/queries'
import { absoluteUrl, localizedAlternates } from '@/lib/seo'
import { OrderStatusBanner } from './_components/order-status-banner'
import { HeroSection } from './_components/hero-section'
import { ConceptSection } from './_components/concept-section'
import { CraftProcessSection } from './_components/craft-process-section'
import { SeriesSection } from './_components/series-section'
import { JsonLd } from './_components/json-ld'

export const dynamic = 'force-dynamic'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const description = dict.seo.homeDescription
  return {
    description,
    alternates: localizedAlternates(locale, ''),
    openGraph: { title: dict.common.siteNameFull, description, url: absoluteUrl(`/${locale}`), type: 'website' },
    twitter: { card: 'summary', title: dict.common.siteNameFull, description },
  }
}

export default async function StoreHomePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const supabase = createClient()

  const [status, products, productionSteps, siteSettings] = await Promise.all([
    getOrderAcceptanceStatus(supabase),
    getFeaturedActiveProducts(supabase),
    getProductionStepNames(supabase),
    // TASK-26: SanityはブランディングコンテンツのCMSであり本編(受注・商品情報)には無関係のため、
    // 取得失敗・未設定時は例外を握りつぶしてダミー値表示にフォールバックする。
    getSiteSettings().catch(() => null),
  ])

  return (
    <div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: dict.common.siteNameFull,
          url: absoluteUrl(`/${locale}`),
          ...(siteSettings?.snsLinks && siteSettings.snsLinks.length > 0
            ? { sameAs: siteSettings.snsLinks.map((link) => link.url) }
            : {}),
        }}
      />

      <OrderStatusBanner locale={locale} status={status} />

      <HeroSection
        locale={locale}
        siteSettings={siteSettings}
        fallbackTitle={dict.home.brandStatement}
        fallbackSubtitle={dict.home.brandSubtext}
        ctaLabel={dict.home.ctaShop}
        ctaHref={`/${locale}/products`}
      />

      <ConceptSection
        locale={locale}
        heading={locale === 'ja' ? siteSettings?.conceptHeading?.ja : siteSettings?.conceptHeading?.en}
        items={siteSettings?.conceptItems}
      />

      <CraftProcessSection locale={locale} steps={productionSteps} craftProcessSteps={siteSettings?.craftProcessSteps ?? []} />

      <SeriesSection
        locale={locale}
        heading={locale === 'ja' ? siteSettings?.seriesHeading?.ja : siteSettings?.seriesHeading?.en}
        ctaLabel={locale === 'ja' ? siteSettings?.seriesCtaLabel?.ja : siteSettings?.seriesCtaLabel?.en}
        items={siteSettings?.seriesItems}
      />

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-6 text-center font-serif text-xl text-sumi">{dict.home.featuredHeading}</h2>
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
