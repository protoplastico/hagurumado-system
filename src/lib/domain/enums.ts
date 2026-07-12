// db_design.md §1のENUMに対応するUI用の値リスト

export const PAYMENT_STATUS_VALUES = ['pending', 'paid', 'refunded', 'cancelled'] as const
export type PaymentStatusValue = (typeof PAYMENT_STATUS_VALUES)[number]

export const REGION_VALUES = ['domestic', 'international'] as const
export const PEN_MAKER_VALUES = ['WACOM', 'XPPEN', 'XENCELABS', 'APPLE', 'OTHER'] as const
export const ORDER_SOURCE_VALUES = ['own_site', 'base_import'] as const
export const PRODUCT_SERIES_VALUES = [
  'LITE',
  'ERGO',
  'WAZAI',
  'PRO',
  'PREMIUM',
  'APPLE_PENCIL',
  'OTHER',
] as const

export const PEN_MAKER_LABELS: Record<string, string> = {
  WACOM: 'Wacom',
  XPPEN: 'XP-Pen',
  XENCELABS: 'Xencelabs',
  APPLE: 'Apple',
  OTHER: 'その他',
}

export const PRODUCT_SERIES_LABELS: Record<string, string> = {
  LITE: 'Lite',
  ERGO: 'Ergo',
  WAZAI: '和材',
  PRO: 'Pro',
  PREMIUM: 'Premium',
  APPLE_PENCIL: 'Apple Pencil',
  OTHER: 'その他',
}

export const LOCALE_LABELS: Record<string, string> = {
  ja: '日本語',
  en: 'English',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: '未決済',
  paid: '決済済',
  refunded: '返金',
  cancelled: 'キャンセル',
}

export const REGION_LABELS: Record<string, string> = {
  domestic: '国内',
  international: '海外',
}

export const ORDER_SOURCE_LABELS: Record<string, string> = {
  own_site: '自社サイト',
  base_import: 'BASE取込',
}
