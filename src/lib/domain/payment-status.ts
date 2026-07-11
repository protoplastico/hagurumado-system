import type { SupabaseClient } from '@supabase/supabase-js'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'cancelled'

// db_design.md §3 / fn_update_payment_statusへの型付きラッパー
// cancelledへの変更は、まだ生産着手前後(received/queued/in_batch)のアイテムを連動キャンセルする。
export async function updatePaymentStatus(
  supabase: SupabaseClient,
  orderId: string,
  newStatus: PaymentStatus
): Promise<void> {
  const { error } = await supabase.rpc('fn_update_payment_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
  })
  if (error) throw error
}
