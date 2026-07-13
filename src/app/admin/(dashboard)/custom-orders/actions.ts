'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CustomOrderStatus } from '@/lib/domain/custom-order'

const SIGNED_URL_EXPIRES_IN = 60 * 60 // 1時間。メディアURLは署名付き(公開URL禁止、TASK-35受入条件)。

export async function getMediaSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('custom-order-media')
    .createSignedUrls(paths, SIGNED_URL_EXPIRES_IN)
  if (error) throw error

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl
  }
  return map
}

export async function updateInquiryStatus(id: string, status: CustomOrderStatus): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('custom_order_inquiries').update({ status }).eq('id', id)
  if (error) throw error
  revalidatePath(`/admin/custom-orders/${id}`)
  revalidatePath('/admin/custom-orders')
}
