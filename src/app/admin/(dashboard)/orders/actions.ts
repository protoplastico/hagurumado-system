'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { updatePaymentStatus, type PaymentStatus } from '@/lib/domain/payment-status'
import { createEmailDraft } from '@/lib/email/create-draft'
import type { EmailLocale } from '@/lib/email/types'

export async function saveAdminMemo(orderId: string, memo: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('orders').update({ admin_memo: memo }).eq('id', orderId)
  if (error) throw error
  revalidatePath(`/admin/orders/${orderId}`)
}

export async function changePaymentStatus(orderId: string, newStatus: PaymentStatus): Promise<void> {
  const supabase = createAdminClient()
  await updatePaymentStatus(supabase, orderId, newStatus)

  if (newStatus === 'paid') {
    await createOrderConfirmDraft(supabase, orderId)
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
}

async function createOrderConfirmDraft(supabase: SupabaseClient, orderId: string): Promise<void> {
  const { data: order } = await supabase
    .from('orders')
    .select('order_number, locale, customer_id, customers(name)')
    .eq('id', orderId)
    .single()
  if (!order) return

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, variation_name')
    .eq('order_id', orderId)

  const { data: waitWeeksRow } = await supabase
    .from('estimated_wait_weeks')
    .select('estimated_wait_weeks')
    .single()

  const itemsSummary =
    (items ?? []).map((item) => `${item.product_name}(${item.variation_name})`).join(' / ') || '-'
  const customerName =
    (order.customers as unknown as { name: string | null }[] | null)?.[0]?.name ?? 'お客'

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

export async function createDelayDraft(
  orderId: string,
  newExpectedDate: string,
  reason: string
): Promise<void> {
  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('order_number, locale, customer_id, customers(name)')
    .eq('id', orderId)
    .single()
  if (error) throw error
  if (!order) throw new Error('order not found')

  const customerName =
    (order.customers as unknown as { name: string | null }[] | null)?.[0]?.name ?? 'お客'

  await createEmailDraft(
    supabase,
    {
      type: 'delay',
      locale: order.locale as EmailLocale,
      context: {
        orderNumber: order.order_number,
        customerName,
        newExpectedDate,
        reason,
      },
    },
    orderId,
    order.customer_id
  )

  revalidatePath(`/admin/orders/${orderId}`)
}
