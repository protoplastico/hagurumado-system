'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createShippingBatch } from '@/lib/domain/shipping'

export async function createShippingBatchFromPool(orderIds: string[]): Promise<string> {
  const supabase = createAdminClient()
  return await createShippingBatch(supabase, orderIds)
}
