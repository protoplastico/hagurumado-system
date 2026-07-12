import {NextResponse, type NextRequest} from 'next/server'
import {revalidateTag} from 'next/cache'
import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'

export const runtime = 'nodejs'

// TASK-25: SanityのGROQ-powered Webhookからのon-demand revalidation。
// Studio側でWebhookを作成する際、投影(Projection)を以下の形にすること:
//   {"_type": _type, "slug": slug.current, "productCode": productCode}
// (存在しないフィールドはnullになるだけで問題ない)
type SanityWebhookPayload = {
  _type?: string
  slug?: string | null
  productCode?: string | null
}

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({error: 'webhook not configured'}, {status: 500})
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME)
  if (!signature) {
    return NextResponse.json({error: 'missing signature'}, {status: 400})
  }

  const rawBody = await request.text()

  const valid = await isValidSignature(rawBody, signature, secret)
  if (!valid) {
    return NextResponse.json({error: 'invalid signature'}, {status: 400})
  }

  let payload: SanityWebhookPayload
  try {
    payload = JSON.parse(rawBody) as SanityWebhookPayload
  } catch {
    return NextResponse.json({error: 'invalid payload'}, {status: 400})
  }

  const tags: string[] = []
  switch (payload._type) {
    case 'productContent':
      tags.push('productContent')
      if (payload.productCode) tags.push(`productContent:${payload.productCode}`)
      break
    case 'guidePage':
      tags.push('guidePage')
      if (payload.slug) tags.push(`guidePage:${payload.slug}`)
      break
    case 'blogPost':
      tags.push('blogPost')
      if (payload.slug) tags.push(`blogPost:${payload.slug}`)
      break
    case 'siteSettings':
      tags.push('siteSettings')
      break
    default:
      break
  }

  for (const tag of tags) revalidateTag(tag)

  return NextResponse.json({revalidated: true, tags})
}
