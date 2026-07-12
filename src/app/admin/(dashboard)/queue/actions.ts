'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBatch } from '@/lib/domain/production'
import { createEmailDraft } from '@/lib/email/create-draft'
import type { EmailLocale } from '@/lib/email/types'

// バッチ作成後の画面遷移(A-07かんばんへ)はクライアント側でrouter.pushする。
// server action内でredirect()すると、呼び出し元のtry/catchが
// Next.js内部のリダイレクト用エラーを誤って捕捉してしまうため。
export async function createBatchFromQueue(woodSpecies: string, itemIds: string[]): Promise<string> {
  const supabase = createAdminClient()
  const batchId = await createBatch(supabase, woodSpecies, itemIds)
  await createProductionStartDrafts(supabase, batchId)
  return batchId
}

// バッチに含まれる注文ごと(1バッチに複数注文が混在しうる)にproduction_startのdraftを作成する。
async function createProductionStartDrafts(supabase: SupabaseClient, batchId: string): Promise<void> {
  const { data: items } = await supabase.from('order_items').select('order_id').eq('batch_id', batchId)
  const orderIds = Array.from(new Set((items ?? []).map((item) => item.order_id as string)))

  for (const orderId of orderIds) {
    const { data: order } = await supabase
      .from('orders')
      .select('order_number, locale, customer_id, customers(name)')
      .eq('id', orderId)
      .single()
    if (!order) continue

    const customerName =
      (order.customers as unknown as { name: string | null }[] | null)?.[0]?.name ?? 'お客'

    await createEmailDraft(
      supabase,
      {
        type: 'production_start',
        locale: order.locale as EmailLocale,
        context: { orderNumber: order.order_number, customerName },
      },
      orderId,
      order.customer_id
    )
  }
}
