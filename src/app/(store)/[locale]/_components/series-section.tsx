import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import type { SeriesItem } from '@/lib/sanity/types'

const SERIES_CODES = ['LITE', 'ERGO', 'WAZAI', 'PRO', 'PREMIUM'] as const

// TASK-26: シリーズ紹介(LITE/ERGO/和材/PRO/PREMIUM→一覧へ導線)。
// 受入条件「全文言がSanityから編集可能」のため、Sanity siteSettings.seriesItems等の紹介文を正とし、
// 未入力時のみi18n辞書のプレースホルダ文言にフォールバックする。
export function SeriesSection({
  locale,
  heading,
  ctaLabel,
  items,
}: {
  locale: Locale
  heading?: string
  ctaLabel?: string
  items?: SeriesItem[]
}) {
  const dict = t(locale)
  const fallbackBlurbs: Record<(typeof SERIES_CODES)[number], string> = {
    LITE: dict.home.seriesBlurbLite,
    ERGO: dict.home.seriesBlurbErgo,
    WAZAI: dict.home.seriesBlurbWazai,
    PRO: dict.home.seriesBlurbPro,
    PREMIUM: dict.home.seriesBlurbPremium,
  }
  const blurbByCode = new Map((items ?? []).map((item) => [item.seriesCode, item]))

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="mb-10 text-center font-serif text-xl text-sumi">{heading || dict.home.seriesHeading}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {SERIES_CODES.map((code) => {
          const item = blurbByCode.get(code)
          const blurb = (locale === 'ja' ? item?.blurb?.ja : item?.blurb?.en) || fallbackBlurbs[code]
          return (
            <Link
              key={code}
              href={`/${locale}/products?series=${code}`}
              className="block border border-sumi/10 bg-kinari-light p-5 text-center transition-colors hover:border-accent"
            >
              <p className="font-serif text-base text-sumi">{dict.series[code]}</p>
              <p className="mt-2 text-xs leading-relaxed text-sumi/60">{blurb}</p>
              <span className="mt-3 inline-block text-xs text-accent underline">{ctaLabel || dict.home.seriesCta}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
