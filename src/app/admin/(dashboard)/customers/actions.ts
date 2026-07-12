'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function saveCustomerMemo(customerId: string, notes: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('customers').update({ notes }).eq('id', customerId)
  if (error) throw error
  revalidatePath(`/admin/customers/${customerId}`)
}

export type CustomerProfileInput = {
  name: string
  phone: string
  postal_code: string
  address1: string
  address2: string
  country: string
  locale: 'ja' | 'en'
}

export async function updateCustomerProfile(customerId: string, input: CustomerProfileInput): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('customers')
    .update({
      name: input.name || null,
      phone: input.phone || null,
      postal_code: input.postal_code || null,
      address1: input.address1 || null,
      address2: input.address2 || null,
      country: input.country || null,
      locale: input.locale,
    })
    .eq('id', customerId)
  if (error) throw error
  revalidatePath(`/admin/customers/${customerId}`)
  revalidatePath('/admin/customers')
}
