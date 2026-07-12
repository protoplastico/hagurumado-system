// TASK-21 S-05(/en)の配送先国選択肢。shipping_rates(20260712000022)のcountries配列と一致させること。
// 仮データにつき、正式な対応国リストは確定待ち(A-15設定画面のshipping_ratesと合わせて見直す)。
export type CheckoutCountryOption = { code: string; nameEn: string }

export const CHECKOUT_COUNTRY_OPTIONS: CheckoutCountryOption[] = [
  { code: 'CN', nameEn: 'China' },
  { code: 'KR', nameEn: 'South Korea' },
  { code: 'TW', nameEn: 'Taiwan' },
  { code: 'HK', nameEn: 'Hong Kong' },
  { code: 'SG', nameEn: 'Singapore' },
  { code: 'TH', nameEn: 'Thailand' },
  { code: 'VN', nameEn: 'Vietnam' },
  { code: 'PH', nameEn: 'Philippines' },
  { code: 'MY', nameEn: 'Malaysia' },
  { code: 'ID', nameEn: 'Indonesia' },
  { code: 'US', nameEn: 'United States' },
  { code: 'CA', nameEn: 'Canada' },
  { code: 'AU', nameEn: 'Australia' },
  { code: 'NZ', nameEn: 'New Zealand' },
  { code: 'GB', nameEn: 'United Kingdom' },
  { code: 'FR', nameEn: 'France' },
  { code: 'DE', nameEn: 'Germany' },
  { code: 'IT', nameEn: 'Italy' },
  { code: 'ES', nameEn: 'Spain' },
  { code: 'NL', nameEn: 'Netherlands' },
  { code: 'SE', nameEn: 'Sweden' },
  { code: 'CH', nameEn: 'Switzerland' },
]
