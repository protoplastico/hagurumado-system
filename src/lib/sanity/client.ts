import {createClient, type QueryParams} from '@sanity/client'
import {SANITY_API_READ_TOKEN, SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID} from './env'

// TASK-25: useCdn=falseとし、キャッシュ制御はNext.jsのData Cache(fetch()のnext.revalidate/tags)に
// 一本化する(Sanity CDNキャッシュとNextのon-demand revalidationを併用すると、Webhook経由の即時反映が
// Sanity CDN側の遅延でブロックされるため)。
const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_API_READ_TOKEN,
  useCdn: false,
  perspective: 'published',
})

export type SanityFetchOptions = {
  // ISR: 既定60秒(TASK-25指示書)。Sanity Webhookからのon-demand revalidationは
  // 同じtagsに対してrevalidateTag()を呼ぶことで即時反映する(src/app/api/webhooks/sanity/route.ts)。
  revalidate?: number | false
  tags?: string[]
}

export async function sanityFetch<T>(
  query: string,
  params: QueryParams = {},
  {revalidate = 60, tags = []}: SanityFetchOptions = {}
): Promise<T> {
  return client.fetch<T>(query, params, {
    cache: revalidate === false ? 'no-store' : 'force-cache',
    next: revalidate === false ? undefined : {revalidate, tags},
  })
}

export default client
