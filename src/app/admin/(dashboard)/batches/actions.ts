'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { advanceBatchStep, returnItemToQueue } from '@/lib/domain/production'

export async function advanceBatchStepAction(batchId: string): Promise<void> {
  const supabase = createAdminClient()
  await advanceBatchStep(supabase, batchId)
  revalidatePath(`/admin/batches/${batchId}`)
  revalidatePath('/admin/batches')
  revalidatePath('/admin/queue')
  revalidatePath('/admin')
}

export async function returnItemToQueueAction(itemId: string, reason: string): Promise<void> {
  const supabase = createAdminClient()
  await returnItemToQueue(supabase, itemId, reason)
  revalidatePath('/admin/batches')
  revalidatePath('/admin/queue')
}
