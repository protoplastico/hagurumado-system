import Image from 'next/image'
import Link from 'next/link'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getBlogPosts } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { absoluteUrl } from '@/lib/seo'

const PAGE_SIZE = 12

// ページネーションURL(?page=N)はcanonicalを自ページに向け(重複コンテンツとして
// 潰さない)、hreflangは各言語の1ページ目を指す(ページ番号違いの相互alternateは
// 意味を持たないため)。
export function generateMetadata({ params, searchParams }: { params: { locale: string }; searchParams: { page?: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const description = dict.seo.blogListDescription
  const page = Math.max(0, Number(searchParams.page ?? '0') || 0)
  const path = page > 0 ? `/blog?page=${page}` : '/blog'
  return {
    title: dict.blog.heading,
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}${path}`),
      languages: { ja: absoluteUrl('/ja/blog'), en: absoluteUrl('/en/blog'), 'x-default': absoluteUrl('/ja/blog') },
    },
    openGraph: { title: dict.blog.heading, description, url: absoluteUrl(`/${locale}/blog`), type: 'website' },
    twitter: { card: 'summary', title: dict.blog.heading, description },
  }
}

function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// TASK-27: ブログ一覧をSanity blogPostから取得。0件時はエラーにせず空状態を表示する。
export default async function BlogListPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { page?: string }
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const page = Math.max(0, Number(searchParams.page ?? '0') || 0)
  const { posts, total } = await getBlogPosts(page, PAGE_SIZE).catch(() => ({ posts: [], total: 0 }))
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 font-serif text-xl text-sumi">{dict.blog.heading}</h1>

      {posts.length === 0 ? (
        <p className="text-sm text-sumi/60">{dict.blog.empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) => {
            const title = locale === 'ja' ? post.title.ja : (post.title.en ?? post.title.ja)
            return (
              <Link key={post._id} href={`/${locale}/blog/${post.slug.current}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden bg-kinari-light">
                  {post.coverImage && (
                    <Image
                      src={urlFor(post.coverImage).width(600).height(450).fit('crop').auto('format').url()}
                      alt={post.coverImage.alt?.[locale === 'ja' ? 'ja' : 'en'] ?? title}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-2 text-xs text-sumi/50">{formatDate(post.publishedAt, locale)}</p>
                <p className="text-sm font-medium text-sumi group-hover:text-accent">{title}</p>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex justify-center gap-4 text-sm">
          {page > 0 && (
            <Link href={`/${locale}/blog?page=${page - 1}`} className="text-sumi/70 hover:text-accent">
              &larr; {dict.blog.prevPage}
            </Link>
          )}
          <span className="text-sumi/50">
            {page + 1} / {totalPages}
          </span>
          {page < totalPages - 1 && (
            <Link href={`/${locale}/blog?page=${page + 1}`} className="text-sumi/70 hover:text-accent">
              {dict.blog.nextPage} &rarr;
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
