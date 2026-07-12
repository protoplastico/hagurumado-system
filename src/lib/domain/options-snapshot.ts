import type { Locale } from '@/lib/i18n'
import type { ProductDetailOptionGroup, ProductDetailOptionValue } from '@/lib/domain/store-products'

// db_design.md §2.3 order_items.options_snapshot の形式に一致させる:
// [{"group":"表面の仕上げ","value":"マット仕上げ","delta":0}]
// 注文時点のlocaleで確定した名称・価格差分を複製保存する(スナップショット原則)。
export type OptionsSnapshotEntry = { group: string; value: string; delta: number }

export function buildOptionsSnapshot(
  selections: { group: ProductDetailOptionGroup; value: ProductDetailOptionValue }[],
  locale: Locale
): OptionsSnapshotEntry[] {
  return selections.map(({ group, value }) => ({
    group: locale === 'ja' ? group.name_ja : group.name_en,
    value: locale === 'ja' ? value.name_ja : value.name_en,
    delta: locale === 'ja' ? value.price_delta_domestic : value.price_delta_international,
  }))
}

export function getOptionDelta(value: ProductDetailOptionValue, locale: Locale): number {
  return locale === 'ja' ? value.price_delta_domestic : value.price_delta_international
}
