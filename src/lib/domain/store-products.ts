import type { SupabaseClient } from '@supabase/supabase-js'
import type { Locale } from '@/lib/i18n'

export type StoreProductSummary = {
  code: string
  name_ja: string
  name_en: string
  wood_species_ja: string | null
  wood_species_en: string | null
  price_domestic: number
  price_international: number
  image_path: string | null
}

// S-01トップの商品ラインナップ用。is_active=falseの商品はRLS(anon can read active products)で
// 既に除外されるが、TASK-18受入条件「RLS/クエリ両方で担保」に沿いクエリ側でも明示的に絞り込む。
export async function getFeaturedActiveProducts(
  supabase: SupabaseClient,
  limit = 6
): Promise<StoreProductSummary[]> {
  const { data, error } = await supabase
    .from('products')
    .select('code, name_ja, name_en, wood_species_ja, wood_species_en, price_domestic, price_international, image_path')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as StoreProductSummary[]
}

export type ProductSitemapEntry = { code: string; updated_at: string }

// TASK-28: sitemap.xml生成用。is_active=falseの商品(下書き・非公開扱い)は含めない。
export async function getAllActiveProductsForSitemap(supabase: SupabaseClient): Promise<ProductSitemapEntry[]> {
  const { data, error } = await supabase.from('products').select('code, updated_at').eq('is_active', true)
  if (error) throw error
  return (data ?? []) as ProductSitemapEntry[]
}

export type ProductListFilters = {
  maker?: string
  series?: string
  minPrice?: number
  maxPrice?: number
  locale: Locale
}

export type StoreProductCard = StoreProductSummary & {
  series: string
  acceptingOrders: boolean
}

type VariationEmbed = { maker: string; accepting_orders: boolean }

// S-02商品一覧。makerフィルタ指定時のみvariationsをinner joinする
// (variation未登録の商品は「対応ペンメーカー」で絞り込むと本来一致しないため除外が正しい挙動。
//  フィルタ未指定時はvariation未登録の商品も一覧から消えないようleft joinのまま扱う)。
export async function getFilteredProducts(
  supabase: SupabaseClient,
  filters: ProductListFilters
): Promise<StoreProductCard[]> {
  const variationsSelect = filters.maker ? 'variations!inner(maker, accepting_orders)' : 'variations(maker, accepting_orders)'

  let query = supabase
    .from('products')
    .select(
      `code, name_ja, name_en, wood_species_ja, wood_species_en, price_domestic, price_international, image_path, series, ${variationsSelect}`
    )
    .eq('is_active', true)

  if (filters.series) query = query.eq('series', filters.series)
  if (filters.maker) query = query.eq('variations.maker', filters.maker)

  const priceColumn = filters.locale === 'ja' ? 'price_domestic' : 'price_international'
  if (filters.minPrice != null) query = query.gte(priceColumn, filters.minPrice)
  if (filters.maxPrice != null) query = query.lte(priceColumn, filters.maxPrice)

  query = query.order('sort_order', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as unknown as (StoreProductSummary & { series: string; variations: VariationEmbed[] })[]).map(
    (row) => ({
      code: row.code,
      name_ja: row.name_ja,
      name_en: row.name_en,
      wood_species_ja: row.wood_species_ja,
      wood_species_en: row.wood_species_en,
      price_domestic: row.price_domestic,
      price_international: row.price_international,
      image_path: row.image_path,
      series: row.series,
      acceptingOrders: (row.variations ?? []).some((v) => v.accepting_orders),
    })
  )
}

export type ProductDetailVariation = {
  id: string
  name_ja: string
  name_en: string
  maker: string
  model_code: string | null
  accepting_orders: boolean
  sort_order: number
}

export type ProductDetailOptionValue = {
  id: string
  name_ja: string
  name_en: string
  price_delta_domestic: number
  price_delta_international: number
  requires_note: boolean
  sort_order: number
}

export type ProductDetailOptionGroup = {
  id: string
  code: string
  name_ja: string
  name_en: string
  is_required: boolean
  sort_order: number
  values: ProductDetailOptionValue[]
}

export type ProductDetail = {
  id: string
  code: string
  series: string
  name_ja: string
  name_en: string
  wood_species_ja: string | null
  wood_species_en: string | null
  price_domestic: number
  price_international: number
  is_custom_order: boolean
  image_path: string | null
  variations: ProductDetailVariation[]
  optionGroups: ProductDetailOptionGroup[]
}

// S-03商品詳細。is_active=falseはRLSで既に取得不可(anon can read active products)。
export async function getProductDetail(supabase: SupabaseClient, code: string): Promise<ProductDetail | null> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('code', code)
    .single()
  if (productError) {
    if (productError.code === 'PGRST116') return null // no rows
    throw productError
  }
  if (!product) return null

  const [variationsResult, assignmentsResult] = await Promise.all([
    supabase
      .from('variations')
      .select('id, name_ja, name_en, maker, model_code, accepting_orders, sort_order')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('product_option_groups')
      .select('is_required, sort_order, option_groups(id, code, name_ja, name_en)')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
  ])
  if (variationsResult.error) throw variationsResult.error
  if (assignmentsResult.error) throw assignmentsResult.error

  const groupRows = (assignmentsResult.data ?? []) as unknown as {
    is_required: boolean
    sort_order: number
    option_groups: { id: string; code: string; name_ja: string; name_en: string }[]
  }[]
  const groupIds = groupRows.map((row) => row.option_groups[0]?.id).filter((id): id is string => !!id)

  const { data: valueRows, error: valuesError } = await supabase
    .from('option_values')
    .select('id, group_id, name_ja, name_en, price_delta_domestic, price_delta_international, requires_note, sort_order')
    .in('group_id', groupIds.length > 0 ? groupIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (valuesError) throw valuesError

  const valuesByGroup = new Map<string, ProductDetailOptionValue[]>()
  for (const row of (valueRows ?? []) as (ProductDetailOptionValue & { group_id: string })[]) {
    const list = valuesByGroup.get(row.group_id) ?? []
    list.push({
      id: row.id,
      name_ja: row.name_ja,
      name_en: row.name_en,
      price_delta_domestic: row.price_delta_domestic,
      price_delta_international: row.price_delta_international,
      requires_note: row.requires_note,
      sort_order: row.sort_order,
    })
    valuesByGroup.set(row.group_id, list)
  }

  const optionGroups: ProductDetailOptionGroup[] = groupRows
    .map((row) => {
      const group = row.option_groups[0]
      if (!group) return null
      return {
        id: group.id,
        code: group.code,
        name_ja: group.name_ja,
        name_en: group.name_en,
        is_required: row.is_required,
        sort_order: row.sort_order,
        values: valuesByGroup.get(group.id) ?? [],
      }
    })
    .filter((g): g is ProductDetailOptionGroup => g != null)
    // 選択肢が未投入のグループ(A-14で追加予定のもの)はステッパーに出しても選べないため除外する。
    .filter((g) => g.values.length > 0)

  return {
    id: product.id,
    code: product.code,
    series: product.series,
    name_ja: product.name_ja,
    name_en: product.name_en,
    wood_species_ja: product.wood_species_ja,
    wood_species_en: product.wood_species_en,
    price_domestic: product.price_domestic,
    price_international: product.price_international,
    is_custom_order: product.is_custom_order,
    image_path: product.image_path,
    variations: (variationsResult.data ?? []) as ProductDetailVariation[],
    optionGroups,
  }
}
