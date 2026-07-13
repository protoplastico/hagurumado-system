import { isLocale, t, type Locale } from '@/lib/i18n'
import { absoluteUrl, localizedAlternates } from '@/lib/seo'
import { getGripShapeOptions } from '@/lib/domain/custom-order'
import { createClient } from '@/lib/supabase/server'
import { CustomOrderForm } from './_components/custom-order-form'

export const dynamic = 'force-dynamic'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  return {
    title: dict.customOrder.heading,
    alternates: localizedAlternates(locale, '/custom-order'),
    openGraph: {
      title: dict.customOrder.heading,
      description: dict.customOrder.intro,
      url: absoluteUrl(`/${locale}/custom-order`),
      type: 'website',
    },
    // 申込フォームは検索結果に載る意義が薄く、S-03からの導線経由での閲覧を想定するためnoindex。
    robots: { index: false, follow: true },
  }
}

// TASK-35 S-13: オーダーメイド申込フォーム。既存option_values(grip-shapeグループ)を
// 「好みのペン軸形状」の選択肢として再利用する。
export default async function CustomOrderPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const supabase = createClient()
  const gripShapeOptions = await getGripShapeOptions(supabase).catch(() => [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-4 font-serif text-xl text-sumi">{dict.customOrder.heading}</h1>
      <p className="mb-8 text-sm leading-loose text-sumi/70">{dict.customOrder.intro}</p>
      <CustomOrderForm locale={locale} gripShapeOptions={gripShapeOptions} />
    </div>
  )
}
