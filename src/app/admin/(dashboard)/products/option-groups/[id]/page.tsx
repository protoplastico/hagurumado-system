import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { OptionGroupEditClient } from './edit-client'
import type { OptionValueRow } from '../_components/option-values-section'

export const dynamic = 'force-dynamic'

export default async function OptionGroupDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: group, error } = await supabase.from('option_groups').select('*').eq('id', params.id).single()
  if (error || !group) notFound()

  const { data: values } = await supabase
    .from('option_values')
    .select('id, name_ja, name_en, price_delta_domestic, price_delta_international, requires_note, sort_order, is_active')
    .eq('group_id', params.id)
    .order('sort_order', { ascending: true })

  return (
    <OptionGroupEditClient
      group={{
        id: group.id as string,
        code: group.code as string,
        name_ja: group.name_ja as string,
        name_en: group.name_en as string,
        sort_order: group.sort_order as number,
        is_active: group.is_active as boolean,
      }}
      values={(values ?? []) as OptionValueRow[]}
    />
  )
}
