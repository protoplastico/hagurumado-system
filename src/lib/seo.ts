import { LOCALES, type Locale } from '@/lib/i18n'

// TASK-28: サイトの絶対URL基点。本番/ステージングでは環境変数で上書きする
// (TASK-30でVercelのデプロイURLを設定)。未設定時はローカル開発用のダミー値。
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function canonicalFor(locale: Locale, pathWithoutLocale: string) {
  return absoluteUrl(`/${locale}${pathWithoutLocale}`)
}

// hreflang(/ja↔/enの相互alternate+x-default)。pathWithoutLocaleは"/products/lite-brown"のように
// ロケールprefixを含まない形で渡す(トップページは""を渡す)。x-defaultは既定言語(ja)を指す。
export function localizedAlternates(locale: Locale, pathWithoutLocale: string) {
  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, canonicalFor(l, pathWithoutLocale)])
  ) as Record<Locale, string>
  return {
    canonical: canonicalFor(locale, pathWithoutLocale),
    languages: { ...languages, 'x-default': languages.ja },
  }
}
