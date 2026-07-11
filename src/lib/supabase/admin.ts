import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// RLSをバイパスするため、サーバー専用コードでのみ使用すること（クライアントコンポーネントで絶対にimportしない）
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
