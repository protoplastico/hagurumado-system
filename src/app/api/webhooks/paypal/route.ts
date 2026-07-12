import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPayPalWebhookSignature } from '@/lib/paypal/client'
import { markOrderPaid } from '@/lib/domain/checkout'

export const runtime = 'nodejs'

type PayPalCaptureResource = {
  id?: string
  custom_id?: string
  supplementary_data?: { related_ids?: { order_id?: string } }
}

type PayPalWebhookEvent = {
  id: string
  event_type: string
  resource?: PayPalCaptureResource
}

// TASK-22: PAYMENT.CAPTURE.COMPLETED → paid化(markOrderPaid、Stripe Webhookと共通)。
// 承認リダイレクト後のcapture(checkout/paypal-return)がすでにpaid化している場合も多いが、
// markOrderPaid自体が冪等なため二重処理にはならない。署名検証必須、processed_paypal_eventsで
// 同一イベントIDの二重処理も防止する。
export async function POST(request: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 })
  }

  const rawBody = await request.text()
  let event: PayPalWebhookEvent
  try {
    event = JSON.parse(rawBody) as PayPalWebhookEvent
  } catch {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const transmissionId = request.headers.get('paypal-transmission-id')
  const transmissionTime = request.headers.get('paypal-transmission-time')
  const certUrl = request.headers.get('paypal-cert-url')
  const authAlgo = request.headers.get('paypal-auth-algo')
  const transmissionSig = request.headers.get('paypal-transmission-sig')

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return NextResponse.json({ error: 'missing signature headers' }, { status: 400 })
  }

  const verified = await verifyPayPalWebhookSignature({
    transmissionId,
    transmissionTime,
    certUrl,
    authAlgo,
    transmissionSig,
    webhookId,
    eventBody: event,
  })
  if (!verified) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error: insertEventError } = await supabase.from('processed_paypal_events').insert({ event_id: event.id })
  if (insertEventError) {
    if (insertEventError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    throw insertEventError
  }

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    // custom_idは注文作成時(createPayPalOrder)にpurchase_units[0].custom_idへ設定した
    // 内部注文ID(orders.id)がそのままcapture resourceへ引き継がれたもの。
    const orderId = event.resource?.custom_id
    const captureId = event.resource?.id
    if (orderId) {
      if (captureId) {
        await supabase.from('orders').update({ payment_ref: captureId }).eq('id', orderId)
      }
      await markOrderPaid(supabase, orderId)
    }
  }

  return NextResponse.json({ received: true })
}
