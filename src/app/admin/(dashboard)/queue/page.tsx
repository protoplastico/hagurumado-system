import { createAdminClient } from '@/lib/supabase/admin'
import { WoodSpeciesPanel } from './_components/wood-species-panel'
import { QueueBoard, type QueueItem } from './_components/queue-board'

export const dynamic = 'force-dynamic'

export default async function ProductionQueuePage({
  searchParams,
}: {
  searchParams: { wood_species?: string }
}) {
  const supabase = createAdminClient()

  const { data: allItems, error } = await supabase
    .from('production_queue')
    .select('*')
    .order('ordered_at', { ascending: true })

  if (error) throw error

  const items = (allItems ?? []) as QueueItem[]

  const woodSpeciesCounts = new Map<string, number>()
  for (const item of items) {
    if (!item.wood_species) continue
    woodSpeciesCounts.set(item.wood_species, (woodSpeciesCounts.get(item.wood_species) ?? 0) + 1)
  }
  const woodSpeciesList = Array.from(woodSpeciesCounts.entries())
    .map(([species, count]) => ({ species, count }))
    .sort((a, b) => b.count - a.count)

  const selectedSpecies = searchParams.wood_species
  const filteredItems = selectedSpecies ? items.filter((item) => item.wood_species === selectedSpecies) : items

  const { data: batchSizeSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'batch_size_default')
    .single()
  const recommendedBatchSize = Number(batchSizeSetting?.value ?? 20)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">生産キュー</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <WoodSpeciesPanel woodSpeciesList={woodSpeciesList} selected={selectedSpecies} />
        <QueueBoard items={filteredItems} recommendedBatchSize={recommendedBatchSize} selectedWoodSpecies={selectedSpecies} />
      </div>
    </div>
  )
}
