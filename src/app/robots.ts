import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo'

// TASK-28: /adminをDisallow。カート・チェックアウト・マイページはページ側のrobots metaで
// noindexにしているため(TASK-28、各layout.tsx参照)、ここでは/adminのみ明示的に除外する。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin' },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
