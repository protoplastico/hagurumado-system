import type { SupabaseClient } from '@supabase/supabase-js'

export type StoreProductSummary = {
  code: string
  name_ja: string
  name_en: string
  wood_species_ja: string | null
  wood_species_en: string | null
  price_domestic: number
  price_international: number
}

// S-01トップの商品ラインナップ用。is_active=falseの商品はRLS(anon can read active products)で
// 既に除外されるが、TASK-18受入条件「RLS/クエリ両方で担保」に沿いクエリ側でも明示的に絞り込む。
export async function getFeaturedActiveProducts(
  supabase: SupabaseClient,
  limit = 6
): Promise<StoreProductSummary[]> {
  const { data, error } = await supabase
    .from('products')
    .select('code, name_ja, name_en, wood_species_ja, wood_species_en, price_domestic, price_international')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as StoreProductSummary[]
}
