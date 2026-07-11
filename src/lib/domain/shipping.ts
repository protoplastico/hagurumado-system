import type { SupabaseClient } from '@supabase/supabase-js'

export type Carrier = 'clickpost' | 'ems' | 'other'

// db_design.md §3 / TASK-03のPostgreSQL関数群への型付きラッパー

export async function createShippingBatch(
  supabase: SupabaseClient,
  orderIds: string[]
): Promise<string> {
  const { data, error } = await supabase.rpc('fn_create_shipping_batch', {
    p_order_ids: orderIds,
  })
  if (error) throw error
  return data as string
}

export async function markShipped(
  supabase: SupabaseClient,
  shipmentId: string,
  carrier: Carrier,
  trackingNumber: string
): Promise<void> {
  const { error } = await supabase.rpc('fn_mark_shipped', {
    p_shipment_id: shipmentId,
    p_carrier: carrier,
    p_tracking_number: trackingNumber,
  })
  if (error) throw error
}
