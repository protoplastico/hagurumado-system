'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export type ProductInput = {
  code: string
  series: string
  name_ja: string
  name_en: string
  wood_species_ja: string
  wood_species_en: string
  price_domestic: number
  price_international: number
  is_custom_order: boolean
  is_active: boolean
  sort_order: number
}

function toProductRow(input: ProductInput) {
  return {
    code: input.code,
    series: input.series,
    name_ja: input.name_ja,
    name_en: input.name_en,
    wood_species_ja: input.wood_species_ja || null,
    wood_species_en: input.wood_species_en || null,
    price_domestic: input.price_domestic,
    price_international: input.price_international,
    is_custom_order: input.is_custom_order,
    is_active: input.is_active,
    sort_order: input.sort_order,
  }
}

// 価格変更はproductsマスタのみを更新する。order_itemsは受注時点のunit_price/options_snapshotを
// 複製保存済み(スナップショット原則、CLAUDE.md)のため、既存注文の明細金額には影響しない。
export async function createProduct(input: ProductInput): Promise<void> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('products').insert(toProductRow(input)).select('id').single()
  if (error) throw error
  revalidatePath('/admin/products')
  redirect(`/admin/products/${data.id}`)
}

export async function updateProduct(productId: string, input: ProductInput): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').update(toProductRow(input)).eq('id', productId)
  if (error) throw error
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/admin/products')
}

export async function toggleProductActive(productId: string, next: boolean): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').update({ is_active: next }).eq('id', productId)
  if (error) throw error
  revalidatePath('/admin/products')
}

// TASK-19: 商品画像(Supabase Storage `product-images`バケット、products.image_pathに相対パスを保存)。
export async function uploadProductImage(productId: string, formData: FormData): Promise<void> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) throw new Error('ファイルが選択されていません')

  const supabase = createAdminClient()

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('image_path')
    .eq('id', productId)
    .single()
  if (fetchError) throw fetchError
  const previousPath = existing?.image_path as string | null

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${productId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) throw uploadError

  const { error: updateError } = await supabase.from('products').update({ image_path: path }).eq('id', productId)
  if (updateError) throw updateError

  if (previousPath) {
    await supabase.storage.from('product-images').remove([previousPath])
  }

  revalidatePath(`/admin/products/${productId}`)
}

export async function removeProductImage(productId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('image_path')
    .eq('id', productId)
    .single()
  if (fetchError) throw fetchError
  const path = existing?.image_path as string | null

  const { error: updateError } = await supabase.from('products').update({ image_path: null }).eq('id', productId)
  if (updateError) throw updateError

  if (path) {
    await supabase.storage.from('product-images').remove([path])
  }

  revalidatePath(`/admin/products/${productId}`)
}

export type VariationInput = {
  name_ja: string
  name_en: string
  maker: string
  model_code: string
  sort_order: number
}

export async function createVariation(productId: string, input: VariationInput): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('variations').insert({
    product_id: productId,
    name_ja: input.name_ja,
    name_en: input.name_en,
    maker: input.maker,
    model_code: input.model_code || null,
    sort_order: input.sort_order,
  })
  if (error) throw error
  revalidatePath(`/admin/products/${productId}`)
}

export async function updateVariation(productId: string, variationId: string, input: VariationInput): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('variations')
    .update({
      name_ja: input.name_ja,
      name_en: input.name_en,
      maker: input.maker,
      model_code: input.model_code || null,
      sort_order: input.sort_order,
    })
    .eq('id', variationId)
  if (error) throw error
  revalidatePath(`/admin/products/${productId}`)
}

export async function toggleVariationAccepting(productId: string, variationId: string, next: boolean): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('variations').update({ accepting_orders: next }).eq('id', variationId)
  if (error) throw error
  revalidatePath(`/admin/products/${productId}`)
}

export async function deleteVariation(productId: string, variationId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('variations').delete().eq('id', variationId)
  if (error) throw error
  revalidatePath(`/admin/products/${productId}`)
}

export async function assignOptionGroup(
  productId: string,
  optionGroupId: string,
  isRequired: boolean,
  sortOrder: number
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('product_option_groups')
    .insert({ product_id: productId, option_group_id: optionGroupId, is_required: isRequired, sort_order: sortOrder })
  if (error) throw error
  revalidatePath(`/admin/products/${productId}`)
}

export async function updateProductOptionGroup(
  productId: string,
  optionGroupId: string,
  input: { isRequired?: boolean; sortOrder?: number }
): Promise<void> {
  const supabase = createAdminClient()
  const patch: Record<string, unknown> = {}
  if (input.isRequired !== undefined) patch.is_required = input.isRequired
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder
  const { error } = await supabase
    .from('product_option_groups')
    .update(patch)
    .eq('product_id', productId)
    .eq('option_group_id', optionGroupId)
  if (error) throw error
  revalidatePath(`/admin/products/${productId}`)
}

export async function removeProductOptionGroup(productId: string, optionGroupId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('product_option_groups')
    .delete()
    .eq('product_id', productId)
    .eq('option_group_id', optionGroupId)
  if (error) throw error
  revalidatePath(`/admin/products/${productId}`)
}
