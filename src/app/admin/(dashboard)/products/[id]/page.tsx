import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProductImageUrl } from '@/lib/domain/product-image'
import { ProductEditClient } from './edit-client'
import type { VariationRow } from '../_components/variations-section'

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: product, error } = await supabase.from('products').select('*').eq('id', params.id).single()
  if (error || !product) notFound()

  const { data: variations } = await supabase
    .from('variations')
    .select('id, name_ja, name_en, maker, model_code, accepting_orders, sort_order')
    .eq('product_id', params.id)
    .order('sort_order', { ascending: true })

  const { data: assignments } = await supabase
    .from('product_option_groups')
    .select('option_group_id, is_required, sort_order, option_groups(name_ja)')
    .eq('product_id', params.id)
    .order('sort_order', { ascending: true })

  const { data: allGroups } = await supabase.from('option_groups').select('id, name_ja').order('sort_order')

  const assignedIds = new Set((assignments ?? []).map((a) => a.option_group_id as string))
  const availableGroups = (allGroups ?? [])
    .filter((g) => !assignedIds.has(g.id as string))
    .map((g) => ({ id: g.id as string, name_ja: g.name_ja as string }))

  const assignedGroups = (assignments ?? []).map((a) => ({
    optionGroupId: a.option_group_id as string,
    name_ja: (a.option_groups as unknown as { name_ja: string }[])[0]?.name_ja ?? '-',
    is_required: a.is_required as boolean,
    sort_order: a.sort_order as number,
  }))

  return (
    <ProductEditClient
      product={{
        id: product.id as string,
        code: product.code as string,
        series: product.series as string,
        name_ja: product.name_ja as string,
        name_en: product.name_en as string,
        wood_species_ja: (product.wood_species_ja as string | null) ?? '',
        wood_species_en: (product.wood_species_en as string | null) ?? '',
        price_domestic: product.price_domestic as number,
        price_international: product.price_international as number,
        is_custom_order: product.is_custom_order as boolean,
        is_active: product.is_active as boolean,
        sort_order: product.sort_order as number,
      }}
      variations={(variations ?? []) as VariationRow[]}
      assignedGroups={assignedGroups}
      availableGroups={availableGroups}
      imageUrl={getProductImageUrl(supabase, product.image_path as string | null)}
    />
  )
}
