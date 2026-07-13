import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getGuidePage } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { SanityPortableText } from '@/lib/sanity/portable-text'
import { absoluteUrl, localizedAlternates } from '@/lib/seo'

// TASK-27: TASK-24の静的3ページ(お使いのペンの見分けかた/発送について/よくあるご質問)を
// Sanity guidePageへ移行。URLは/guide/[slug]のまま(同一URL構造を維持、リダイレクト不要)。
export async function generateMetadata({ params }: { params: { locale: string; slug: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const page = await getGuidePage(params.slug).catch(() => null)
  if (!page) return { title: dict.guide.heading }

  const title = locale === 'ja' ? page.title.ja : (page.title.en ?? page.title.ja)
  const description = (locale === 'ja' ? page.summary?.ja : page.summary?.en) || dict.seo.guideDetailFallback
  const ogImage = page.coverImage ? urlFor(page.coverImage).width(1200).height(630).fit('crop').auto('format').url() : undefined
  const path = `/guide/${params.slug}`

  return {
    title,
    description,
    alternates: localizedAlternates(locale, path),
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/${locale}${path}`),
      type: 'article',
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: { card: ogImage ? 'summary_large_image' : 'summary', title, description },
  }
}

export default async function GuidePageDetail({ params }: { params: { locale: string; slug: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const page = await getGuidePage(params.slug).catch(() => null)

  if (!page) notFound()

  const title = locale === 'ja' ? page.title.ja : (page.title.en ?? page.title.ja)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/${locale}/guide`} className="text-xs text-sumi/60 hover:text-accent">
        &larr; {dict.guide.backToGuide}
      </Link>
      <h1 className="mb-6 mt-3 font-serif text-xl text-sumi">{title}</h1>
      <SanityPortableText content={page.body} locale={locale} />
    </div>
  )
}
