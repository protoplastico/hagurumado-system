'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/client'
import { getDomesticShippingFee, getInternationalShippingFee } from '@/lib/domain/shipping-fee'
import type { Locale } from '@/lib/i18n'

export type CheckoutOptionInput = { valueId: string; note?: string }

export type CheckoutItemInput = {
  productId: string
  variationId: string | null
  options: CheckoutOptionInput[]
  quantity: number
}

export type ShippingInput = {
  name: string
  email: string
  phone: string
  postalCode: string
  address1: string
  address2: string
  // ja(国内)は常に'JP'固定、en(海外)はCHECKOUT_COUNTRY_OPTIONSからの選択(ISO 3166-1 alpha-2)
  country: string
  customerMessage: string
  // 希望配達日は国内(ja)のみ入力可
  desiredDeliveryDate: string | null
}

export type CreateCheckoutSessionInput = {
  locale: Locale
  origin: string
  items: CheckoutItemInput[]
  shipping: ShippingInput
}

export type CreateCheckoutSessionResult = { ok: true; url: string } | { ok: false; error: string }

const GENERIC_UNAVAILABLE_ERROR = 'ご注文いただけない商品が含まれています。カートの内容をご確認のうえ、やり直してください。'

type ResolvedItem = {
  productId: string
  variationId: string | null
  quantity: number
  productNameSnapshot: string
  variationNameSnapshot: string
  series: string
  woodSpecies: string | null
  maker: string | null
  isCustomOrder: boolean
  unitPrice: number
  optionsSnapshot: { group: string; value: string; delta: number }[]
  customNote: string | null
}

// TASK-21: 注文作成API(Server Action)。クライアントから届く価格は一切信用せず、
// 商品・機種・オプションの現在価格/受注可否をすべてサーバー側で再取得して検証する。
export async function createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> {
  if (input.items.length === 0) {
    return { ok: false, error: 'カートが空です。' }
  }

  const supabase = createAdminClient()

  const { data: acceptingSetting, error: acceptingError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'accepting_orders_global')
    .single()
  if (acceptingError) throw acceptingError
  if (acceptingSetting?.value !== true) {
    return { ok: false, error: 'ただいま受注を一時休止しております。恐れ入りますが、しばらくお待ちください。' }
  }

  const region = input.locale === 'ja' ? 'domestic' : 'international'
  const resolvedItems: ResolvedItem[] = []

  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { ok: false, error: '数量が不正です。' }
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select(
        'id, name_ja, name_en, series, wood_species_ja, price_domestic, price_international, is_active, is_custom_order'
      )
      .eq('id', item.productId)
      .eq('is_active', true)
      .maybeSingle()
    if (productError) throw productError
    if (!product || product.is_custom_order) {
      return { ok: false, error: GENERIC_UNAVAILABLE_ERROR }
    }

    let variationNameJa: string | null = null
    let variationNameEn: string | null = null
    let variationMaker: string | null = null
    if (item.variationId) {
      const { data: variation, error: variationError } = await supabase
        .from('variations')
        .select('name_ja, name_en, maker, accepting_orders, product_id')
        .eq('id', item.variationId)
        .maybeSingle()
      if (variationError) throw variationError
      if (!variation || variation.product_id !== product.id || !variation.accepting_orders) {
        return { ok: false, error: GENERIC_UNAVAILABLE_ERROR }
      }
      variationNameJa = variation.name_ja
      variationNameEn = variation.name_en
      variationMaker = variation.maker
    }

    const optionsSnapshot: { group: string; value: string; delta: number }[] = []
    const customNoteParts: string[] = []
    let optionsDelta = 0

    if (item.options.length > 0) {
      const valueIds = item.options.map((o) => o.valueId)
      const { data: valueRows, error: valuesError } = await supabase
        .from('option_values')
        .select(
          'id, name_ja, name_en, price_delta_domestic, price_delta_international, requires_note, option_groups(name_ja, name_en)'
        )
        .in('id', valueIds)
        .eq('is_active', true)
      if (valuesError) throw valuesError

      const rows = (valueRows ?? []) as unknown as {
        id: string
        name_ja: string
        name_en: string
        price_delta_domestic: number
        price_delta_international: number
        requires_note: boolean
        option_groups: { name_ja: string; name_en: string }[]
      }[]

      if (rows.length !== new Set(valueIds).size) {
        return { ok: false, error: GENERIC_UNAVAILABLE_ERROR }
      }

      const byId = new Map(rows.map((r) => [r.id, r]))
      for (const opt of item.options) {
        const row = byId.get(opt.valueId)
        if (!row) return { ok: false, error: GENERIC_UNAVAILABLE_ERROR }
        if (row.requires_note && !opt.note?.trim()) {
          return { ok: false, error: 'ご要望の記入が必要な項目があります。商品詳細ページからやり直してください。' }
        }
        const delta = input.locale === 'ja' ? row.price_delta_domestic : row.price_delta_international
        optionsDelta += delta
        optionsSnapshot.push({
          group: input.locale === 'ja' ? (row.option_groups[0]?.name_ja ?? '') : (row.option_groups[0]?.name_en ?? ''),
          value: input.locale === 'ja' ? row.name_ja : row.name_en,
          delta,
        })
        if (opt.note?.trim()) customNoteParts.push(opt.note.trim())
      }
    }

    const basePrice = input.locale === 'ja' ? product.price_domestic : product.price_international

    resolvedItems.push({
      productId: product.id,
      variationId: item.variationId,
      quantity: item.quantity,
      productNameSnapshot: input.locale === 'ja' ? product.name_ja : product.name_en,
      variationNameSnapshot: (input.locale === 'ja' ? variationNameJa : variationNameEn) ?? '',
      series: product.series,
      // 生産バッチは樹種の完全一致でグルーピングするため(fn_create_batch)、注文言語に関わらず
      // 常に和名(wood_species_ja)で保存する。国内外の同一樹種を正しく同一バッチにまとめるための措置。
      woodSpecies: product.wood_species_ja,
      maker: variationMaker,
      isCustomOrder: product.is_custom_order,
      unitPrice: basePrice + optionsDelta,
      optionsSnapshot,
      customNote: customNoteParts.length > 0 ? customNoteParts.join('\n') : null,
    })
  }

  const subtotal = resolvedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  let shippingFee: number
  if (region === 'domestic') {
    shippingFee = await getDomesticShippingFee(supabase)
  } else {
    const fee = await getInternationalShippingFee(supabase, input.shipping.country)
    if (fee == null) {
      return { ok: false, error: '恐れ入りますが、選択された配送先には現在対応しておりません。ガイドページよりお問い合わせください。' }
    }
    shippingFee = fee
  }

  const total = subtotal + shippingFee

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert(
      {
        email: input.shipping.email,
        name: input.shipping.name,
        phone: input.shipping.phone,
        postal_code: input.shipping.postalCode,
        address1: input.shipping.address1,
        address2: input.shipping.address2,
        country: input.shipping.country,
        locale: input.locale,
        source: 'own_site',
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single()
  if (customerError) throw customerError

  const { data: orderNumber, error: orderNumberError } = await supabase.rpc('next_order_number')
  if (orderNumberError) throw orderNumberError

  const { data: insertedOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: customer.id,
      locale: input.locale,
      region,
      payment_status: 'pending',
      payment_method: 'stripe_card',
      subtotal,
      shipping_fee: shippingFee,
      total,
      ship_name: input.shipping.name,
      ship_postal: input.shipping.postalCode,
      ship_address1: input.shipping.address1,
      ship_address2: input.shipping.address2,
      ship_country: input.shipping.country,
      ship_phone: input.shipping.phone,
      customer_message: input.shipping.customerMessage.trim() || null,
      desired_delivery_date: region === 'domestic' ? input.shipping.desiredDeliveryDate : null,
      source: 'own_site',
      ordered_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (orderError) throw orderError

  // 物理1本=1行(CLAUDE.md絶対規則):数量nの明細はn行に展開してから挿入する
  const orderItemRows: Record<string, unknown>[] = []
  let lineNo = 1
  for (const item of resolvedItems) {
    for (let i = 0; i < item.quantity; i++) {
      orderItemRows.push({
        order_id: insertedOrder.id,
        line_no: lineNo++,
        product_id: item.productId,
        product_name: item.productNameSnapshot,
        variation_name: item.variationNameSnapshot,
        series: item.series,
        wood_species: item.woodSpecies,
        maker: item.maker,
        options_snapshot: item.optionsSnapshot,
        custom_note: item.customNote,
        unit_price: item.unitPrice,
        is_custom_order: item.isCustomOrder,
        production_status: 'received',
      })
    }
  }

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemRows)
  if (itemsError) throw itemsError

  const stripe = getStripeClient()
  const lineItems = resolvedItems.map((item) => ({
    price_data: {
      currency: 'jpy',
      unit_amount: item.unitPrice,
      product_data: {
        name: item.variationNameSnapshot
          ? `${item.productNameSnapshot} / ${item.variationNameSnapshot}`
          : item.productNameSnapshot,
      },
    },
    quantity: item.quantity,
  }))
  lineItems.push({
    price_data: {
      currency: 'jpy',
      unit_amount: shippingFee,
      product_data: { name: input.locale === 'ja' ? '送料' : 'Shipping' },
    },
    quantity: 1,
  })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: input.shipping.email,
      success_url: `${input.origin}/${input.locale}/checkout/complete?order_number=${encodeURIComponent(orderNumber as string)}`,
      cancel_url: `${input.origin}/${input.locale}/checkout?cancelled=1`,
      metadata: { order_id: insertedOrder.id, order_number: orderNumber as string },
    })

    if (!session.url) {
      return { ok: false, error: '決済ページの準備に失敗しました。時間をおいて再度お試しください。' }
    }

    await supabase.from('orders').update({ payment_ref: session.id }).eq('id', insertedOrder.id)

    return { ok: true, url: session.url }
  } catch {
    // 注文自体はpendingで作成済み。決済セッション生成の失敗はfn_cancel_stale_pending_orders
    // (48時間放置クリーンアップ)に任せ、ここでは注文を残したままエラーのみ返す。
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
