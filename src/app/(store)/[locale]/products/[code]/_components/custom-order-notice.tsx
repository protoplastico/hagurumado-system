import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'

// is_custom_order商品(フルオーダーメイド)はステッパーの代わりに案内+問い合わせ導線を表示する。
// 申込フォーム(S-13)はPhase 5以降のため、現時点ではガイドページへの導線のみ。
export function CustomOrderNotice({ locale }: { locale: Locale }) {
  const dict = t(locale)

  return (
    <div className="border border-sumi/10 bg-kinari-light p-5">
      <h2 className="mb-2 text-sm font-semibold text-sumi">{dict.productDetail.customOrderHeading}</h2>
      <p className="mb-4 text-sm leading-relaxed text-sumi/80">{dict.productDetail.customOrderNotice}</p>
      <Link
        href={`/${locale}/guide`}
        className="inline-block border border-sumi/30 px-5 py-2 text-sm text-sumi hover:border-accent hover:text-accent"
      >
        {dict.productDetail.customOrderContactCta}
      </Link>
    </div>
  )
}
