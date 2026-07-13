import Link from 'next/link'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getGuidePages } from '@/lib/sanity/queries'

export const dynamic = 'force-dynamic'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  return { title: t(locale).guide.heading }
}

// TASK-27: ガイド索引をSanity guidePageから動的に取得する(TASK-24の静的実装から移行)。
// Studioで新規ガイドを追加すれば、コード変更なしにこの一覧・詳細ページに反映される。
export default async function GuideIndexPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const pages = await getGuidePages().catch(() => [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-serif text-xl text-sumi">{dict.guide.heading}</h1>

      {pages.length === 0 ? (
        <p className="text-sm text-sumi/60">{dict.guide.empty}</p>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => {
            const title = locale === 'ja' ? page.title.ja : (page.title.en ?? page.title.ja)
            const summary = locale === 'ja' ? page.summary?.ja : page.summary?.en
            return (
              <Link
                key={page._id}
                href={`/${locale}/guide/${page.slug.current}`}
                className="block border border-sumi/10 bg-kinari-light p-4 transition-colors hover:border-accent"
              >
                <p className="text-sm font-medium text-sumi">{title}</p>
                {summary && <p className="mt-1 text-xs text-sumi/60">{summary}</p>}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
