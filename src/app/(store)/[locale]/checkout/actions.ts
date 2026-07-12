'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/client'
import { createPayPalOrder as createPayPalOrderApi } from '@/lib/paypal/client'
import { getDomesticShippingFee, getInternationalShippingFee } from '@/lib/domain/shipping-fee'
import { createPendingOrder, type CheckoutItemInput, type ShippingInput } from '@/lib/domain/checkout'
import type { Locale } from '@/lib/i18n'

export type { CheckoutOptionInput, CheckoutItemInput, ShippingInput } from '@/lib/domain/checkout'

export type CreateCheckoutSessionInput = {
  locale: Locale
  origin: string
  items: CheckoutItemInput[]
  shipping: ShippingInput
}

export type CreateCheckoutSessionResult = { ok: true; url: string } | { ok: false; error: string }

// TASK-21: Stripe Checkout(ホスト型)。注文作成(価格再検証込み)はcreatePendingOrderに委譲する。
export async function createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> {
  const supabase = createAdminClient()

  const pending = await createPendingOrder(supabase, {
    locale: input.locale,
    items: input.items,
    shipping: input.shipping,
    paymentMethod: 'stripe_card',
  })
  if (!pending.ok) return pending

  const stripe = getStripeClient()
  const lineItems = pending.lineItems.map((item) => ({
    price_data: {
      currency: 'jpy',
      unit_amount: item.unitAmount,
      product_data: { name: item.name },
    },
    quantity: item.quantity,
  }))
  lineItems.push({
    price_data: {
      currency: 'jpy',
      unit_amount: pending.shippingFee,
      product_data: { name: input.locale === 'ja' ? '送料' : 'Shipping' },
    },
    quantity: 1,
  })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: input.shipping.email,
      success_url: `${input.origin}/${input.locale}/checkout/complete?order_number=${encodeURIComponent(pending.orderNumber)}`,
      cancel_url: `${input.origin}/${input.locale}/checkout?cancelled=1`,
      metadata: { order_id: pending.orderId, order_number: pending.orderNumber },
    })

    if (!session.url) {
      return { ok: false, error: '決済ページの準備に失敗しました。時間をおいて再度お試しください。' }
    }

    await supabase.from('orders').update({ payment_ref: session.id }).eq('id', pending.orderId)

    return { ok: true, url: session.url }
  } catch {
    // 注文自体はpendingで作成済み。決済セッション生成の失敗はfn_cancel_stale_pending_orders
    // (48時間放置クリーンアップ)に任せ、ここでは注文を残したままエラーのみ返す。
    return { ok: false, error: '決済ページの準備に失敗しました。時間をおいて再度お試しください。' }
  }
}

export type CreatePayPalOrderInput = {
  locale: Locale
  origin: string
  items: CheckoutItemInput[]
  shipping: ShippingInput
}

export type CreatePayPalOrderResult = { ok: true; approveUrl: string } | { ok: false; error: string }

// TASK-22: PayPal Orders API v2(Checkout)。注文作成はStripeと同じcreatePendingOrderを再利用する。
export async function createPayPalOrder(input: CreatePayPalOrderInput): Promise<CreatePayPalOrderResult> {
  const supabase = createAdminClient()

  const pending = await createPendingOrder(supabase, {
    locale: input.locale,
    items: input.items,
    shipping: input.shipping,
    paymentMethod: 'paypal',
  })
  if (!pending.ok) return pending

  try {
    const { paypalOrderId, approveUrl } = await createPayPalOrderApi({
      orderId: pending.orderId,
      orderNumber: pending.orderNumber,
      total: pending.total,
      returnUrl: `${input.origin}/${input.locale}/checkout/paypal-return`,
      cancelUrl: `${input.origin}/${input.locale}/checkout?cancelled=1`,
    })

    await supabase.from('orders').update({ payment_ref: paypalOrderId }).eq('id', pending.orderId)

    return { ok: true, approveUrl }
  } catch {
    // Stripeと同様、注文はpendingのまま残し48時間放置クリーンアップに任せる。
    return { ok: false, error: '決済ページの準備に失敗しました。時間をおいて再度お試しください。' }
  }
}

// S-05チェックアウトフォームの送料リアルタイム表示用
export async function getShippingFeePreview(locale: Locale, country: string | null): Promise<number | null> {
  const supabase = createClient()
  if (locale === 'ja') return getDomesticShippingFee(supabase)
  if (!country) return null
  return getInternationalShippingFee(supabase, country)
}

// S-06注文完了ページの推定待ち週数表示用(estimated_wait_weeksはanonに公開済み)
export async function getEstimatedWaitWeeksForComplete(): Promise<number | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('estimated_wait_weeks').select('estimated_wait_weeks').single()
  if (error) throw error
  return data?.estimated_wait_weeks ?? null
}
