import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { toPlainText } from '@portabletext/react'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getBlogPost } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { absoluteUrl, localizedAlternates } from '@/lib/seo'
import { BlogPostBody } from './_components/blog-post-body'

const DESCRIPTION_MAX_LENGTH = 120

// TASK-27: ブログ詳細。Portable Text本文+見出しから自動生成した目次、
// カバー画像をog:imageとして設定するOGP対応を行う。
// TASK-28: 本文冒頭のプレーンテキストを抜粋してdescriptionとする(専用summaryフィールドは
// guidePageのみのため、本文からの抜粋で代替)。
export async function generateMetadata({ params }: { params: { locale: string; slug: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const post = await getBlogPost(params.slug).catch(() => null)
  if (!post) return { title: dict.blog.heading }

  const title = locale === 'ja' ? post.title.ja : (post.title.en ?? post.title.ja)
  const bodyBlocks = locale === 'ja' ? post.body?.ja : post.body?.en
  const excerpt = bodyBlocks && bodyBlocks.length > 0 ? toPlainText(bodyBlocks).slice(0, DESCRIPTION_MAX_LENGTH) : ''
  const description = excerpt || dict.seo.blogDetailFallback
  const ogImage = post.coverImage
    ? urlFor(post.coverImage).width(1200).height(630).fit('crop').auto('format').url()
    : undefined
  const path = `/blog/${params.slug}`

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

function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPostDetail({ params }: { params: { locale: string; slug: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const post = await getBlogPost(params.slug).catch(() => null)

  if (!post) notFound()

  const title = locale === 'ja' ? post.title.ja : (post.title.en ?? post.title.ja)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/${locale}/blog`} className="text-xs text-sumi/60 hover:text-accent">
        &larr; {dict.blog.backToBlog}
      </Link>
      {post.coverImage && (
        <div className="mt-4 aspect-[16/9] overflow-hidden bg-kinari-light">
          <Image
            src={urlFor(post.coverImage).width(1200).height(675).fit('crop').auto('format').url()}
            alt={post.coverImage.alt?.[locale === 'ja' ? 'ja' : 'en'] ?? title}
            width={1200}
            height={675}
            className="h-full w-full object-cover"
            priority
          />
        </div>
      )}
      <p className="mb-2 mt-4 text-xs text-sumi/50">{formatDate(post.publishedAt, locale)}</p>
      <h1 className="mb-6 font-serif text-xl text-sumi">{title}</h1>
      <BlogPostBody content={post.body} locale={locale} />
    </div>
  )
}
