import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getProductDetail } from '@/lib/domain/store-products'
import { getOrderAcceptanceStatus } from '@/lib/domain/store-status'
import { getProductImageUrl } from '@/lib/domain/product-image'
import { formatPrice, getPriceForLocale } from '@/lib/domain/pricing'
import { ProductImage } from '../../_components/product-image'
import { CustomizeStepper } from './_components/customize-stepper'
import { CustomOrderNotice } from './_components/custom-order-notice'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { locale: string; code: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const supabase = createClient()
  const product = await getProductDetail(supabase, params.code)
  if (!product) return { title: t(locale).productDetail.notFoundHeading }
  return { title: locale === 'ja' ? product.name_ja : product.name_en }
}

export default async function ProductDetailPage({ params }: { params: { locale: string; code: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const supabase = createClient()

  const [product, status] = await Promise.all([
    getProductDetail(supabase, params.code),
    getOrderAcceptanceStatus(supabase),
  ])

  if (!product) notFound()

  const name = locale === 'ja' ? product.name_ja : product.name_en
  const woodSpecies = locale === 'ja' ? product.wood_species_ja : product.wood_species_en

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <ProductImage src={getProductImageUrl(supabase, product.image_path)} alt={name} />

        <div>
          <h1 className="text-xl font-semibold text-sumi">{name}</h1>
          {woodSpecies && <p className="mt-1 text-sm text-sumi/60">{woodSpecies}</p>}
          <p className="mt-3 text-lg text-accent">{formatPrice(getPriceForLocale(product, locale), locale)}</p>
        </div>
      </div>

      <div className="mt-8">
        {product.is_custom_order ? (
          <CustomOrderNotice locale={locale} />
        ) : (
          <CustomizeStepper locale={locale} product={product} acceptingOrdersGlobal={status.acceptingOrders} />
        )}
      </div>
    </div>
  )
}
