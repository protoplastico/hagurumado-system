import type { SupabaseClient } from '@supabase/supabase-js'

export type ShippingRate = {
  regionGroup: string
  nameJa: string
  nameEn: string
  countries: string[]
  fee: number
}

// TASK-21: 国内送料はsettings.domestic_shipping_fee(円、固定額)
export async function getDomesticShippingFee(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase.from('settings').select('value').eq('key', 'domestic_shipping_fee').single()
  if (error) throw error
  return Number(data.value)
}

export async function getShippingRates(supabase: SupabaseClient): Promise<ShippingRate[]> {
  const { data, error } = await supabase.from('shipping_rates').select('region_group, name_ja, name_en, countries, fee')
  if (error) throw error
  return (data ?? []).map((row) => ({
    regionGroup: row.region_group,
    nameJa: row.name_ja,
    nameEn: row.name_en,
    countries: row.countries,
    fee: row.fee,
  }))
}

// 国コード(ISO 3166-1 alpha-2)からshipping_ratesのfeeを引く。未対応国の場合はnull。
export async function getInternationalShippingFee(supabase: SupabaseClient, countryCode: string): Promise<number | null> {
  const rates = await getShippingRates(supabase)
  const matched = rates.find((r) => r.countries.includes(countryCode))
  return matched ? matched.fee : null
}
