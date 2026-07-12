'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export type OptionGroupInput = {
  code: string
  name_ja: string
  name_en: string
  sort_order: number
  is_active: boolean
}

export async function createOptionGroup(input: OptionGroupInput): Promise<void> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('option_groups').insert(input).select('id').single()
  if (error) throw error
  revalidatePath('/admin/products/option-groups')
  redirect(`/admin/products/option-groups/${data.id}`)
}

export async function updateOptionGroup(groupId: string, input: OptionGroupInput): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('option_groups').update(input).eq('id', groupId)
  if (error) throw error
  revalidatePath(`/admin/products/option-groups/${groupId}`)
  revalidatePath('/admin/products/option-groups')
}

export type OptionValueInput = {
  name_ja: string
  name_en: string
  price_delta_domestic: number
  price_delta_international: number
  requires_note: boolean
  sort_order: number
  is_active: boolean
}

// オプション単価差分の変更もproductsと同様スナップショット原則の対象(options_snapshotに複製済み)。
export async function createOptionValue(groupId: string, input: OptionValueInput): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('option_values').insert({ group_id: groupId, ...input })
  if (error) throw error
  revalidatePath(`/admin/products/option-groups/${groupId}`)
}

export async function updateOptionValue(groupId: string, valueId: string, input: OptionValueInput): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('option_values').update(input).eq('id', valueId)
  if (error) throw error
  revalidatePath(`/admin/products/option-groups/${groupId}`)
}

export async function deleteOptionValue(groupId: string, valueId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('option_values').delete().eq('id', valueId)
  if (error) throw error
  revalidatePath(`/admin/products/option-groups/${groupId}`)
}
