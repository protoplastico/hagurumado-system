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
