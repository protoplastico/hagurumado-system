'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { markShipped, type Carrier } from '@/lib/domain/shipping'

export async function markShipmentShipped(
  batchId: string,
  shipmentId: string,
  carrier: Carrier,
  trackingNumber: string
): Promise<void> {
  const supabase = createAdminClient()
  await markShipped(supabase, shipmentId, carrier, trackingNumber)
  revalidatePath(`/admin/shipping/${batchId}`)
  revalidatePath('/admin/shipping')
}
