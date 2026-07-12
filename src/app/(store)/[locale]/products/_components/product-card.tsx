import Link from 'next/link'
import type { SupabaseClient } from '@supabase/supabase-js'
import { t, type Locale } from '@/lib/i18n'
import { formatPrice, getPriceForLocale } from '@/lib/domain/pricing'
import { getProductImageUrl } from '@/lib/domain/product-image'
import type { StoreProductCard as StoreProductCardData } from '@/lib/domain/store-products'
import { ProductImage } from '../../_components/product-image'

export function ProductCard({
  locale,
  product,
  supabase,
}: {
  locale: Locale
  product: StoreProductCardData
  supabase: SupabaseClient
}) {
  const dict = t(locale)
  const name = locale === 'ja' ? product.name_ja : product.name_en
  const woodSpecies = locale === 'ja' ? product.wood_species_ja : product.wood_species_en

  return (
    <Link
      href={`/${locale}/products/${product.code}`}
      className="block border border-sumi/10 bg-kinari-light transition-colors hover:border-accent"
    >
      <ProductImage src={getProductImageUrl(supabase, product.image_path)} alt={name} />
      <div className="p-3">
        <p className="text-sm font-medium text-sumi">{name}</p>
        {woodSpecies && <p className="mt-1 text-xs text-sumi/60">{woodSpecies}</p>}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-accent">{formatPrice(getPriceForLocale(product, locale), locale)}</span>
          <span
            className={`text-xs ${product.acceptingOrders ? 'text-sumi/50' : 'font-medium text-red-800'}`}
          >
            {product.acceptingOrders ? dict.productList.acceptingTrue : dict.productList.acceptingFalse}
          </span>
        </div>
      </div>
    </Link>
  )
}
