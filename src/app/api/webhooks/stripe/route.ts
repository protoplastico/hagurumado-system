import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { markOrderPaid } from '@/lib/domain/checkout'

// Stripe SDKはEdge Runtime非対応のためNode.jsランタイムを明示する
export const runtime = 'nodejs'

// TASK-21: checkout.session.completed → paid化 → received全アイテムqueued化 → 注文確認メールdraft作成
// (markOrderPaidに集約。TASK-22でPayPal側とも共有する)。
// 署名検証必須・同一イベントIDの二重処理はprocessed_stripe_eventsで防止する。
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()
  const stripe = getStripeClient()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 冪等性:先に自分がevent_idの挿入に成功した場合のみ処理を進める。
  // 一意制約違反(23505)=既に他リクエストが処理済みとみなし、正常応答で早期returnする。
  const { error: insertEventError } = await supabase.from('processed_stripe_events').insert({ event_id: event.id })
  if (insertEventError) {
    if (insertEventError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    throw insertEventError
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (orderId) {
      await markOrderPaid(supabase, orderId)
    }
  }

  return NextResponse.json({ received: true })
}
