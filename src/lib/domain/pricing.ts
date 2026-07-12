import type { Locale } from '@/lib/i18n'

// 要件定義書§3.2「価格体系」/ TASK-18指示書:/ja=国内価格、/en=海外価格。
// 海外価格も円建て(確定事項#10)のため、通貨換算は行わない。
export function getPriceForLocale(
  product: { price_domestic: number; price_international: number },
  locale: Locale
): number {
  return locale === 'ja' ? product.price_domestic : product.price_international
}

const FORMATTERS: Record<Locale, Intl.NumberFormat> = {
  ja: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
  en: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'JPY' }),
}

export function formatPrice(amount: number, locale: Locale): string {
  return FORMATTERS[locale].format(amount)
}
