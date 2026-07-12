import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getStripeClient } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { updatePaymentStatus } from '@/lib/domain/payment-status'
import { queueOrderItems } from '@/lib/domain/production'
import { createEmailDraft } from '@/lib/email/create-draft'
import type { EmailLocale } from '@/lib/email/types'

// Stripe SDKはEdge Runtime非対応のためNode.jsランタイムを明示する
export const runtime = 'nodejs'

// TASK-21: checkout.session.completed → paid化 → received全アイテムqueued化 → 注文確認メールdraft作成。
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
      await handleCheckoutCompleted(supabase, orderId)
    }
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(supabase: SupabaseClient, orderId: string): Promise<void> {
  await updatePaymentStatus(supabase, orderId, 'paid')
  await queueOrderItems(supabase, orderId)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('order_number, locale, customer_id, customers(name)')
    .eq('id', orderId)
    .single()
  if (orderError) throw orderError
  if (!order) return

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('product_name, variation_name')
    .eq('order_id', orderId)
  if (itemsError) throw itemsError

  const summaryCounts = new Map<string, number>()
  for (const item of items ?? []) {
    const label = item.variation_name ? `${item.product_name}(${item.variation_name})` : item.product_name
    summaryCounts.set(label, (summaryCounts.get(label) ?? 0) + 1)
  }
  const itemsSummary = Array.from(summaryCounts.entries())
    .map(([label, count]) => (count > 1 ? `${label} x${count}` : label))
    .join('、')

  const { data: waitWeeksRow } = await supabase.from('estimated_wait_weeks').select('estimated_wait_weeks').single()

  const customerName = (order.customers as unknown as { name: string | null }[] | null)?.[0]?.name ?? 'お客'

  await createEmailDraft(
    supabase,
    {
      type: 'order_confirm',
      locale: order.locale as EmailLocale,
      context: {
        orderNumber: order.order_number,
        customerName,
        estimatedWaitWeeks: waitWeeksRow?.estimated_wait_weeks ?? null,
        itemsSummary,
      },
    },
    orderId,
    order.customer_id
  )
}
