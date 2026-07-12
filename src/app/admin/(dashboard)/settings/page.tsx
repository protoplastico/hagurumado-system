import { createAdminClient } from '@/lib/supabase/admin'
import { SettingsEditor, type SettingRow } from './_components/settings-editor'
import { ShippingRatesEditor, type ShippingRateRow } from './_components/shipping-rates-editor'

export const dynamic = 'force-dynamic'

// auto_send_*(メール種別ごとの自動送信設定)は/admin/emailsの設定タブが専用UIを持つため、
// ここでは二重管理を避けて対象外とする。
export default async function SettingsPage() {
  const supabase = createAdminClient()
  const [{ data, error }, { data: shippingRates, error: shippingRatesError }] = await Promise.all([
    supabase.from('settings').select('key, value, description').not('key', 'like', 'auto_send_%').order('key'),
    supabase.from('shipping_rates').select('id, region_group, name_ja, countries, fee').order('region_group'),
  ])
  if (error) throw error
  if (shippingRatesError) throw shippingRatesError

  const rows = (data ?? []) as SettingRow[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">設定</h1>
      <p className="text-sm text-gray-500">
        メール種別ごとの自動送信設定は「メール」画面の設定タブで管理します。
      </p>
      <SettingsEditor rows={rows} />
      <ShippingRatesEditor rows={(shippingRates ?? []) as ShippingRateRow[]} />
    </div>
  )
}
