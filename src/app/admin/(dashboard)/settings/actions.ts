'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateSettingValue(key: string, value: number | boolean | null): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('settings').update({ value }).eq('key', key)
  if (error) throw error
  revalidatePath('/admin/settings')
  revalidatePath('/admin')
}

// TASK-21: shipping_rates(海外送料、地域区分ごと)の編集。仮データにつき、正式確定後に金額・対象国を見直す想定。
export async function updateShippingRate(id: string, fee: number, countries: string[]): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('shipping_rates').update({ fee, countries }).eq('id', id)
  if (error) throw error
  revalidatePath('/admin/settings')
}
