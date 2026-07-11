import type { SupabaseClient } from '@supabase/supabase-js'
import type { BatchStatus } from '@/lib/domain/batch-status'

// db_design.md §3 / TASK-03のPostgreSQL関数群への型付きラッパー

export async function createBatch(
  supabase: SupabaseClient,
  woodSpecies: string,
  itemIds: string[]
): Promise<string> {
  const { data, error } = await supabase.rpc('fn_create_batch', {
    p_wood_species: woodSpecies,
    p_item_ids: itemIds,
  })
  if (error) throw error
  return data as string
}

export async function advanceBatchStep(
  supabase: SupabaseClient,
  batchId: string
): Promise<BatchStatus> {
  const { data, error } = await supabase.rpc('fn_advance_batch_step', {
    p_batch_id: batchId,
  })
  if (error) throw error
  return data as BatchStatus
}

export async function returnItemToQueue(
  supabase: SupabaseClient,
  itemId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase.rpc('fn_return_item_to_queue', {
    p_item_id: itemId,
    p_reason: reason,
  })
  if (error) throw error
}
