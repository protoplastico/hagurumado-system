'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { ParsedOrder } from '@/lib/domain/base-import'

export type ImportLogEntry = {
  externalRef: string
  status: 'imported' | 'skipped' | 'failed'
  message?: string
}

export async function importBaseOrders(orders: ParsedOrder[]): Promise<{ log: ImportLogEntry[] }> {
  const supabase = createAdminClient()
  const log: ImportLogEntry[] = []

  if (orders.length === 0) return { log }

  const { data: existing, error: existingError } = await supabase
    .from('orders')
    .select('external_ref')
    .in(
      'external_ref',
      orders.map((o) => o.externalRef)
    )
  if (existingError) throw existingError

  const existingRefs = new Set((existing ?? []).map((r) => r.external_ref as string))

  for (const order of orders) {
    if (existingRefs.has(order.externalRef)) {
      log.push({ externalRef: order.externalRef, status: 'skipped', message: '既存の注文のためスキップ' })
      continue
    }

    try {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .upsert(
          {
            email: order.customerEmail,
            name: order.customerName,
            phone: order.customerPhone,
            postal_code: order.customerPostal,
            address1: order.customerAddress1,
            address2: order.customerAddress2,
            country: order.region === 'domestic' ? 'JP' : null,
            locale: order.locale,
            source: 'base_import',
          },
          { onConflict: 'email' }
        )
        .select('id')
        .single()

      if (customerError) throw customerError

      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: order.orderNumber,
          customer_id: customer.id,
          locale: order.locale,
          region: order.region,
          payment_status: order.paymentStatus,
          payment_method: order.paymentMethod,
          subtotal: order.subtotal,
          shipping_fee: order.shippingFee,
          total: order.total,
          ship_name: order.shipName,
          ship_postal: order.shipPostal,
          ship_address1: order.shipAddress1,
          ship_address2: order.shipAddress2,
          ship_country: order.region === 'domestic' ? 'JP' : null,
          ship_phone: order.shipPhone,
          customer_message: order.customerMessage,
          source: 'base_import',
          external_ref: order.externalRef,
          ordered_at: order.orderedAt,
        })
        .select('id')
        .single()

      if (orderError) throw orderError

      const orderItemRows: Record<string, unknown>[] = []
      let lineNo = 1
      for (const item of order.items) {
        for (let i = 0; i < item.quantity; i++) {
          orderItemRows.push({
            order_id: insertedOrder.id,
            line_no: lineNo++,
            product_name: item.productName,
            variation_name: item.variationName,
            options_snapshot: item.optionsSnapshot,
            unit_price: item.unitPrice,
            production_status: order.productionStatus,
          })
        }
      }

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemRows)
      if (itemsError) throw itemsError

      log.push({ externalRef: order.externalRef, status: 'imported' })
    } catch (err) {
      log.push({
        externalRef: order.externalRef,
        status: 'failed',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { log }
}
