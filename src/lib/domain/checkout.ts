import type { SupabaseClient } from '@supabase/supabase-js'
import { getDomesticShippingFee, getInternationalShippingFee } from '@/lib/domain/shipping-fee'
import { queueOrderItems } from '@/lib/domain/production'
import { updatePaymentStatus } from '@/lib/domain/payment-status'
import { createEmailDraft } from '@/lib/email/create-draft'
import type { EmailLocale } from '@/lib/email/types'
import type { Locale } from '@/lib/i18n'

// TASK-21/22共通:注文作成(価格再検証+スナップショット保存)と決済完了後処理(paid化+queued化+
// 確認メールdraft作成)。決済手段(Stripe/PayPal)ごとの差異はこのモジュールの外側(各actions.ts/
// webhookハンドラ)に閉じ込める。

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

export type CreatePendingOrderInput = {
  locale: Locale
  items: CheckoutItemInput[]
  shipping: ShippingInput
  paymentMethod: 'stripe_card' | 'paypal'
}

export type PendingOrderLineItem = {
  name: string
  unitAmount: number
  quantity: number
}

export type CreatePendingOrderResult =
  | {
      ok: true
      orderId: string
      orderNumber: string
      subtotal: number
      shippingFee: number
      total: number
      lineItems: PendingOrderLineItem[]
    }
  | { ok: false; error: string }

const GENERIC_UNAVAILABLE_ERROR = 'ご注文いただけない商品が含まれています。カートの内容をご確認のうえ、やり直してください。'

type ResolvedItem = {
  productId: string
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

// TASK-21: クライアントから届く価格は一切信用せず、商品・機種・オプションの現在価格/受注可否を
// すべてサーバー側で再取得して検証したうえで、注文(pending)+明細(物理1本=1行)を作成する。
export async function createPendingOrder(
  supabase: SupabaseClient,
  input: CreatePendingOrderInput
): Promise<CreatePendingOrderResult> {
  if (input.items.length === 0) {
    return { ok: false, error: 'カートが空です。' }
  }

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
    const variationNameSnapshot = (input.locale === 'ja' ? variationNameJa : variationNameEn) ?? ''

    resolvedItems.push({
      productId: product.id,
      quantity: item.quantity,
      productNameSnapshot: input.locale === 'ja' ? product.name_ja : product.name_en,
      variationNameSnapshot,
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
      payment_method: input.paymentMethod,
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

  const lineItems: PendingOrderLineItem[] = resolvedItems.map((item) => ({
    name: item.variationNameSnapshot ? `${item.productNameSnapshot} / ${item.variationNameSnapshot}` : item.productNameSnapshot,
    unitAmount: item.unitPrice,
    quantity: item.quantity,
  }))

  return {
    ok: true,
    orderId: insertedOrder.id,
    orderNumber: orderNumber as string,
    subtotal,
    shippingFee,
    total,
    lineItems,
  }
}

// TASK-21/22共通:決済完了後処理(paid化→received全アイテムqueued化→注文確認メールdraft作成)。
// StripeのWebhook、PayPalの承認リダイレクト後capture、PayPalのWebhookのいずれからも呼ばれうるため、
// 二重実行に対して冪等(すでにpaid以外でなければ何もしない)にしてある。
export async function markOrderPaid(supabase: SupabaseClient, orderId: string): Promise<void> {
  const { data: current, error: currentError } = await supabase
    .from('orders')
    .select('payment_status')
    .eq('id', orderId)
    .single()
  if (currentError) throw currentError
  if (current.payment_status !== 'pending') {
    // 他経路(Webhookとリダイレクト後captureの競合等)ですでに処理済み。冪等に無視する。
    return
  }

  try {
    await updatePaymentStatus(supabase, orderId, 'paid')
  } catch (err) {
    // 上記チェック後、この呼び出しまでの間に競合が発生した場合、fn_update_payment_status側の
    // FOR UPDATEロックにより後着の呼び出しが「不正な遷移」例外を投げる。冪等に無視してよいかを再確認する。
    const { data: recheck } = await supabase.from('orders').select('payment_status').eq('id', orderId).single()
    if (recheck?.payment_status === 'paid') return
    throw err
  }

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
