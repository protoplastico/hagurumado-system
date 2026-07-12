import Link from 'next/link'
import { isLocale, t, type Locale } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  return { title: t(locale).guide.heading }
}

// TASK-24 S-10: ガイド3ページの索引。静的実装(Phase 4でSanity化)。
export default function GuideIndexPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)

  const cards = [
    { href: `/${locale}/guide/pen-identification`, title: dict.guide.penIdentificationTitle, summary: dict.guide.penIdentificationSummary },
    { href: `/${locale}/guide/shipping`, title: dict.guide.shippingTitle, summary: dict.guide.shippingSummary },
    { href: `/${locale}/guide/faq`, title: dict.guide.faqTitle, summary: dict.guide.faqSummary },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-sumi">{dict.guide.heading}</h1>
      <div className="space-y-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block border border-sumi/10 bg-kinari-light p-4 transition-colors hover:border-accent"
          >
            <p className="text-sm font-medium text-sumi">{card.title}</p>
            <p className="mt-1 text-xs text-sumi/60">{card.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
