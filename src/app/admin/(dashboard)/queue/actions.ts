'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createBatch } from '@/lib/domain/production'

// バッチ作成後の画面遷移(A-07かんばんへ)はクライアント側でrouter.pushする。
// server action内でredirect()すると、呼び出し元のtry/catchが
// Next.js内部のリダイレクト用エラーを誤って捕捉してしまうため。
export async function createBatchFromQueue(woodSpecies: string, itemIds: string[]): Promise<string> {
  const supabase = createAdminClient()
  return await createBatch(supabase, woodSpecies, itemIds)
}
