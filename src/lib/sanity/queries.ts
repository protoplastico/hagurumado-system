import {sanityFetch} from './client'
import type {BlogPost, GuidePage, ProductContent, SiteSettings} from './types'

// TASK-25: GROQクエリ+型付きフェッチ関数。tagsはon-demand revalidation
// (src/app/api/webhooks/sanity/route.ts)からrevalidateTag()で個別に無効化するために使う。

const PRODUCT_CONTENT_QUERY = /* groq */ `
*[_type == "productContent" && productCode == $productCode][0]{
  _id,
  productCode,
  description,
  woodStory,
  gallery
}`

export async function getProductContent(productCode: string): Promise<ProductContent | null> {
  return sanityFetch<ProductContent | null>(
    PRODUCT_CONTENT_QUERY,
    {productCode},
    {tags: ['productContent', `productContent:${productCode}`]}
  )
}

const GUIDE_PAGE_QUERY = /* groq */ `
*[_type == "guidePage" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  body
}`

export async function getGuidePage(slug: string): Promise<GuidePage | null> {
  return sanityFetch<GuidePage | null>(GUIDE_PAGE_QUERY, {slug}, {tags: ['guidePage', `guidePage:${slug}`]})
}

const GUIDE_PAGES_QUERY = /* groq */ `
*[_type == "guidePage"] | order(title.ja asc){
  _id,
  title,
  slug
}`

export async function getGuidePages(): Promise<Pick<GuidePage, '_id' | 'title' | 'slug'>[]> {
  return sanityFetch(GUIDE_PAGES_QUERY, {}, {tags: ['guidePage']})
}

const BLOG_POST_QUERY = /* groq */ `
*[_type == "blogPost" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  coverImage,
  publishedAt,
  body
}`

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  return sanityFetch<BlogPost | null>(BLOG_POST_QUERY, {slug}, {tags: ['blogPost', `blogPost:${slug}`]})
}

const BLOG_POSTS_QUERY = /* groq */ `
*[_type == "blogPost" && publishedAt <= now()] | order(publishedAt desc) [$start...$end]{
  _id,
  title,
  slug,
  coverImage,
  publishedAt
}`

const BLOG_POSTS_COUNT_QUERY = /* groq */ `count(*[_type == "blogPost" && publishedAt <= now()])`

export async function getBlogPosts(
  page: number,
  pageSize: number
): Promise<{posts: Pick<BlogPost, '_id' | 'title' | 'slug' | 'coverImage' | 'publishedAt'>[]; total: number}> {
  const start = page * pageSize
  const end = start + pageSize
  const [posts, total] = await Promise.all([
    sanityFetch<Pick<BlogPost, '_id' | 'title' | 'slug' | 'coverImage' | 'publishedAt'>[]>(
      BLOG_POSTS_QUERY,
      {start, end},
      {tags: ['blogPost']}
    ),
    sanityFetch<number>(BLOG_POSTS_COUNT_QUERY, {}, {tags: ['blogPost']}),
  ])
  return {posts, total}
}

const SITE_SETTINGS_QUERY = /* groq */ `*[_type == "siteSettings"][0]{
  _id,
  heroTitle,
  heroSubtitle,
  heroImage,
  conceptHeading,
  conceptItems,
  craftProcessSteps | order(stepNo asc),
  seriesHeading,
  seriesCtaLabel,
  seriesItems,
  aboutBody,
  snsLinks
}`

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, {}, {tags: ['siteSettings']})
}
