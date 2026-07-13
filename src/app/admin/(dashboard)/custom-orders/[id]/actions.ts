'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCustomOrderInquiry, getCustomOrderThreads, getGripShapeOptions } from '@/lib/domain/custom-order'
import { generateDiagnosisDraft, generateReplyDraft, type DiagnosisDraft } from '@/lib/custom-order/diagnose'
import { getDomesticShippingFee, getInternationalShippingFee } from '@/lib/domain/shipping-fee'
import { getStripeClient } from '@/lib/stripe/client'
import { sendRawEmail } from '@/lib/email/resend'
import { absoluteUrl } from '@/lib/seo'
import { t } from '@/lib/i18n'

const IMAGE_SIGNED_URL_TTL = 300 // Claude APIへの一時的な画像取得用。5分で十分

async function getInquiryImageUrls(
  supabase: ReturnType<typeof createAdminClient>,
  inquiryId: string
): Promise<{ imageUrls: string[]; hasVideoOnly: boolean }> {
  const threads = await getCustomOrderThreads(supabase, inquiryId)
  const attachments = threads.flatMap((th) => th.attachments)
  const imagePaths = attachments.filter((a) => a.kind === 'image').map((a) => a.path)
  const hasVideoOnly = imagePaths.length === 0 && attachments.some((a) => a.kind === 'video')

  if (imagePaths.length === 0) return { imageUrls: [], hasVideoOnly }

  const { data, error } = await supabase.storage.from('custom-order-media').createSignedUrls(imagePaths, IMAGE_SIGNED_URL_TTL)
  if (error) throw error
  const imageUrls = (data ?? []).map((row) => row.signedUrl).filter((url): url is string => !!url)
  return { imageUrls, hasVideoOnly }
}

// TASK-36項目1:写真付き申込からAI所見ドラフトを生成する(まだ保存・送信はしない。
// 職人が編集して「提案を送信」を押すまでは何も記録されない=直接送信ボタンは存在しない)。
export async function runDiagnosis(inquiryId: string): Promise<DiagnosisDraft & { hasVideoOnly: boolean }> {
  const supabase = createAdminClient()
  const inquiry = await getCustomOrderInquiry(supabase, inquiryId)
  if (!inquiry) throw new Error('inquiry not found')

  const [gripShapeOptions, { imageUrls, hasVideoOnly }] = await Promise.all([
    getGripShapeOptions(supabase),
    getInquiryImageUrls(supabase, inquiryId),
  ])

  const draft = await generateDiagnosisDraft({
    locale: inquiry.locale,
    answers: inquiry.answers,
    imageUrls,
    hasVideoOnly,
    gripShapeOptions,
  })

  return { ...draft, hasVideoOnly }
}

// TASK-36項目3:顧客返信の要点をタイムラインに記録してから、差分整理ドラフトを生成する。
export async function recordReplyAndDraft(inquiryId: string, customerReplySummary: string): Promise<DiagnosisDraft> {
  const supabase = createAdminClient()
  const inquiry = await getCustomOrderInquiry(supabase, inquiryId)
  if (!inquiry) throw new Error('inquiry not found')

  await supabase.from('custom_order_threads').insert({
    inquiry_id: inquiryId,
    customer_id: inquiry.customer_id,
    direction: 'inbound',
    body: customerReplySummary,
    attachments: [],
    ai_draft: false,
  })
  revalidatePath(`/admin/custom-orders/${inquiryId}`)

  const [threads, gripShapeOptions] = await Promise.all([
    getCustomOrderThreads(supabase, inquiryId),
    getGripShapeOptions(supabase),
  ])
  const previousProposal =
    [...threads].reverse().find((th) => th.direction === 'outbound')?.body ?? '(これまでの提案文が見つかりません)'

  return generateReplyDraft({
    locale: inquiry.locale,
    answers: inquiry.answers,
    previousProposal,
    customerReplySummary,
    gripShapeOptions,
  })
}

export type SendProposalInput = {
  inquiryId: string
  proposalBody: string
}

// TASK-36項目2:職人が編集した内容のみを送信できる(このアクションが唯一の送信経路であり、
// AIドラフトをそのまま送る専用ボタンは存在しない=呼び出し元のUIで編集後の値のみを渡す)。
export async function sendProposal(input: SendProposalInput): Promise<void> {
  const supabase = createAdminClient()
  const inquiry = await getCustomOrderInquiry(supabase, input.inquiryId)
  if (!inquiry) throw new Error('inquiry not found')

  await supabase.from('custom_order_threads').insert({
    inquiry_id: input.inquiryId,
    customer_id: inquiry.customer_id,
    direction: 'outbound',
    body: input.proposalBody,
    attachments: [],
    ai_draft: true,
  })

  const dict = t(inquiry.locale)
  await sendRawEmail({
    to: inquiry.customer_email,
    subject: dict.customOrder.proposalEmailSubject,
    text: input.proposalBody,
  })

  await supabase.from('custom_order_inquiries').update({ status: 'proposed' }).eq('id', input.inquiryId)

  revalidatePath(`/admin/custom-orders/${input.inquiryId}`)
  revalidatePath('/admin/custom-orders')
}

export type ConvertToOrderInput = {
  inquiryId: string
  unitPrice: number
  woodSpecies: string | null
  shipping: {
    name: string
    email: string
    phone: string
    postalCode: string
    address1: string
    address2: string
    country: string // ISO 3166-1 alpha-2。'JP'なら国内、それ以外は海外
  }
}

export type ConvertToOrderResult = { ok: true; orderNumber: string } | { ok: false; error: string }

// TASK-36項目4:A-17から「受注化」。通常の生産キュー(is_custom_order=trueアイテム)に載せたうえで、
// Stripe Payment Linkを生成しメールで送付する(通常チェックアウトを経由しない唯一の注文経路)。
export async function convertToOrder(input: ConvertToOrderInput): Promise<ConvertToOrderResult> {
  if (!Number.isInteger(input.unitPrice) || input.unitPrice <= 0) {
    return { ok: false, error: '価格は1円以上の整数で入力してください。' }
  }

  const supabase = createAdminClient()
  const inquiry = await getCustomOrderInquiry(supabase, input.inquiryId)
  if (!inquiry) return { ok: false, error: '申込が見つかりません。' }

  const region = input.shipping.country === 'JP' ? 'domestic' : 'international'
  const shippingFee =
    region === 'domestic'
      ? await getDomesticShippingFee(supabase)
      : await getInternationalShippingFee(supabase, input.shipping.country)
  if (shippingFee == null) {
    return { ok: false, error: '選択された配送先には現在対応しておりません。' }
  }

  const total = input.unitPrice + shippingFee

  const { data: customOrderProduct, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('code', 'custom-order-fee')
    .maybeSingle()
  if (productError) return { ok: false, error: productError.message }

  const { data: orderNumber, error: orderNumberError } = await supabase.rpc('next_order_number')
  if (orderNumberError) return { ok: false, error: orderNumberError.message }

  const { data: insertedOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: inquiry.customer_id,
      locale: inquiry.locale,
      region,
      payment_status: 'pending',
      payment_method: 'stripe_card',
      subtotal: input.unitPrice,
      shipping_fee: shippingFee,
      total,
      ship_name: input.shipping.name,
      ship_postal: input.shipping.postalCode,
      ship_address1: input.shipping.address1,
      ship_address2: input.shipping.address2,
      ship_country: input.shipping.country,
      ship_phone: input.shipping.phone,
      source: 'own_site',
      ordered_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (orderError) return { ok: false, error: orderError.message }

  const { error: itemError } = await supabase.from('order_items').insert({
    order_id: insertedOrder.id,
    line_no: 1,
    product_id: customOrderProduct?.id ?? null,
    product_name: inquiry.locale === 'ja' ? 'フルオーダーメイドグリップ' : 'Full Custom Order Grip',
    variation_name: inquiry.answers.penModel || null,
    wood_species: input.woodSpecies,
    unit_price: input.unitPrice,
    is_custom_order: true,
    production_status: 'received',
  })
  if (itemError) return { ok: false, error: itemError.message }

  const stripe = getStripeClient()
  const successUrl = absoluteUrl(
    `/${inquiry.locale}/checkout/complete?order_number=${encodeURIComponent(orderNumber as string)}&total=${total}`
  )
  let paymentUrl: string
  try {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            unit_amount: total,
            product_data: { name: inquiry.locale === 'ja' ? 'フルオーダーメイドグリップ' : 'Full Custom Order Grip' },
          },
          quantity: 1,
        },
      ],
      metadata: { order_id: insertedOrder.id, order_number: orderNumber as string },
      after_completion: { type: 'redirect', redirect: { url: successUrl } },
    })
    paymentUrl = paymentLink.url
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '決済リンクの作成に失敗しました。' }
  }

  await supabase.from('orders').update({ payment_ref: paymentUrl }).eq('id', insertedOrder.id)

  const dict = t(inquiry.locale)
  await sendRawEmail({
    to: inquiry.customer_email,
    subject: dict.customOrder.paymentLinkEmailSubject,
    text: dict.customOrder.paymentLinkEmailBody
      .replace('{{name}}', inquiry.customer_name)
      .replace('{{paymentUrl}}', paymentUrl)
      .replace('{{orderNumber}}', orderNumber as string),
  })

  await supabase.from('custom_order_inquiries').update({ status: 'ordered' }).eq('id', input.inquiryId)

  revalidatePath(`/admin/custom-orders/${input.inquiryId}`)
  revalidatePath('/admin/custom-orders')

  return { ok: true, orderNumber: orderNumber as string }
}
