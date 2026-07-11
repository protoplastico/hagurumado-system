import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { KanbanBoard, type Batch, type BatchItem, type ProductionStep } from './_components/kanban-board'

export const dynamic = 'force-dynamic'

export default async function BatchKanbanPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: batch, error } = await supabase
    .from('production_batches')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !batch) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('batch_id', params.id)
    .order('line_no', { ascending: true })

  const { data: allSteps } = await supabase
    .from('production_steps')
    .select('*')
    .order('step_no', { ascending: true })

  // 標準工程(scope=batch)に加え、オーダーメイドバッチ(is_custom)の場合のみ
  // 追加工程(is_custom_extra)を列として挿入する。現状is_custom_extra行は0件だが、
  // 将来行が追加された場合に自動で列表示されるようにしておく。
  const steps = (allSteps ?? []).filter(
    (step) => step.scope === 'batch' && (!step.is_custom_extra || batch.is_custom)
  ) as ProductionStep[]

  return <KanbanBoard batch={batch as Batch} items={(items ?? []) as BatchItem[]} steps={steps} />
}
