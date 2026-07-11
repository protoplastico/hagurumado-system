'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { updatePaymentStatus, type PaymentStatus } from '@/lib/domain/payment-status'

export async function saveAdminMemo(orderId: string, memo: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('orders').update({ admin_memo: memo }).eq('id', orderId)
  if (error) throw error
  revalidatePath(`/admin/orders/${orderId}`)
}

export async function changePaymentStatus(orderId: string, newStatus: PaymentStatus): Promise<void> {
  const supabase = createAdminClient()
  await updatePaymentStatus(supabase, orderId, newStatus)
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
}
