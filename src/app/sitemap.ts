import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { LOCALES } from '@/lib/i18n'
import { absoluteUrl } from '@/lib/seo'
import { getAllActiveProductsForSitemap } from '@/lib/domain/store-products'
import { getGuidePages, getAllPublishedBlogSlugs } from '@/lib/sanity/queries'

const STATIC_PATHS = ['', '/products', '/guide', '/blog', '/about', '/legal/tokushoho', '/legal/privacy']

function languageAlternates(pathWithoutLocale: string) {
  return Object.fromEntries(LOCALES.map((locale) => [locale, absoluteUrl(`/${locale}${pathWithoutLocale}`)]))
}

function entriesFor(pathWithoutLocale: string, lastModified?: Date): MetadataRoute.Sitemap {
  const languages = languageAlternates(pathWithoutLocale)
  return LOCALES.map((locale) => ({
    url: absoluteUrl(`/${locale}${pathWithoutLocale}`),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }))
}

// TASK-28: 商品・ガイド・ブログ・静的ページを日英両URLで含む。is_active=false商品・非公開の
// Sanityドキュメント(draftはperspective:'published'のクエリでは取得されない)は含まれない。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()

  const [products, guidePages, blogSlugs] = await Promise.all([
    getAllActiveProductsForSitemap(supabase).catch(() => []),
    getGuidePages().catch(() => []),
    getAllPublishedBlogSlugs().catch(() => []),
  ])

  return [
    ...STATIC_PATHS.flatMap((path) => entriesFor(path)),
    ...products.flatMap((product) => entriesFor(`/products/${product.code}`, new Date(product.updated_at))),
    ...guidePages.flatMap((page) => entriesFor(`/guide/${page.slug.current}`)),
    ...blogSlugs.flatMap((post) => entriesFor(`/blog/${post.slug.current}`, new Date(post.publishedAt))),
  ]
}
