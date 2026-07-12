import ja from './dictionaries/ja'
import en from './dictionaries/en'

export const LOCALES = ['ja', 'en'] as const
export type Locale = (typeof LOCALES)[number]

const dictionaries = { ja, en } as const

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

// 型付き辞書アクセサ。t(locale).home.ctaShop のように参照する(TASK-18指示書:軽量実装+型付きt()関数)。
export function t(locale: Locale) {
  return dictionaries[locale]
}
