import { createAdminClient } from '@/lib/supabase/admin'
import { SettingsEditor, type SettingRow } from './_components/settings-editor'

export const dynamic = 'force-dynamic'

// auto_send_*(メール種別ごとの自動送信設定)は/admin/emailsの設定タブが専用UIを持つため、
// ここでは二重管理を避けて対象外とする。
export default async function SettingsPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('settings')
    .select('key, value, description')
    .not('key', 'like', 'auto_send_%')
    .order('key')
  if (error) throw error

  const rows = (data ?? []) as SettingRow[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">設定</h1>
      <p className="text-sm text-gray-500">
        メール種別ごとの自動送信設定は「メール」画面の設定タブで管理します。
      </p>
      <SettingsEditor rows={rows} />
    </div>
  )
}
