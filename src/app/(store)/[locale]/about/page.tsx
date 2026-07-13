import { isLocale, t, type Locale } from '@/lib/i18n'
import { getSiteSettings } from '@/lib/sanity/queries'
import { SanityPortableText } from '@/lib/sanity/portable-text'
import { absoluteUrl, localizedAlternates } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const description = dict.seo.aboutDescription
  return {
    title: dict.about.heading,
    description,
    alternates: localizedAlternates(locale, '/about'),
    openGraph: { title: dict.about.heading, description, url: absoluteUrl(`/${locale}/about`), type: 'website' },
    twitter: { card: 'summary', title: dict.about.heading, description },
  }
}

// TASK-26: Aboutページ。本文はSanity siteSettings.aboutBody(工房紹介・職人紹介・所在地を
// 見出し付きの1本のPortable Textとして編集する想定)。未入力時は指示書の許容どおり
// プレースホルダで実装する(工房・職人の写真素材、職人紹介文、About原稿は人間から提供予定)。
export default async function AboutPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const siteSettings = await getSiteSettings().catch(() => null)

  const body = locale === 'ja' ? siteSettings?.aboutBody?.ja : siteSettings?.aboutBody?.en
  const hasBody = (body?.length ?? 0) > 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-10 text-center font-serif text-xl text-sumi">{dict.about.heading}</h1>

      {hasBody ? (
        <SanityPortableText content={siteSettings?.aboutBody} locale={locale} />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 font-serif text-base text-sumi">{dict.about.workshopHeading}</h2>
            <p className="border border-amber-800/20 bg-amber-800/5 px-4 py-3 text-sm leading-loose text-amber-900">
              {dict.about.workshopPlaceholder}
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-serif text-base text-sumi">{dict.about.craftsmanHeading}</h2>
            <p className="border border-amber-800/20 bg-amber-800/5 px-4 py-3 text-sm leading-loose text-amber-900">
              {dict.about.craftsmanPlaceholder}
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-serif text-base text-sumi">{dict.about.locationHeading}</h2>
            <p className="text-sm leading-loose text-sumi/80">{dict.about.locationCity}</p>
            <p className="mt-1 border border-amber-800/20 bg-amber-800/5 px-4 py-3 text-sm leading-loose text-amber-900">
              {dict.about.locationPlaceholder}
            </p>
          </section>
        </div>
      )}
    </div>
  )
}
