import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Noto_Serif_JP } from 'next/font/google'
import { isLocale, LOCALES, t, type Locale } from '@/lib/i18n'
import { CartProvider } from '@/lib/store/cart'
import { StoreHeader } from './_components/store-header'
import { StoreFooter } from './_components/store-footer'
import { SetHtmlLang } from './_components/set-html-lang'
import { AnalyticsConsent } from './_components/analytics-consent'

// TASK-26: 和風トーンの明朝系見出し。管理画面(/admin)には適用しない(店舗フロント限定)ため
// ルートlayoutではなくここで読み込む。tailwind.config.tsのfontFamily.serifへ紐付け、
// font-serifユーティリティ経由で使う(portable-text.tsx等の既存の見出しにも自動適用される)。
const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-serif-jp',
  display: 'swap',
})

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

// TASK-28: titleテンプレート「ページ名 | 葉車堂細工所 横須賀」。子ページがstring titleのみ
// 設定した場合に自動でこのテンプレートが適用される(objectで独自titleを返せば上書き可能)。
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  return {
    title: { template: `%s | ${dict.common.siteNameFull}`, default: dict.common.siteNameFull },
  }
}

export default function StoreLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale

  return (
    <CartProvider>
      <div className={`flex min-h-screen flex-col bg-kinari text-sumi ${notoSerifJP.variable}`}>
        <SetHtmlLang locale={locale} />
        <StoreHeader locale={locale} />
        <main className="flex-1">{children}</main>
        <StoreFooter locale={locale} />
        <AnalyticsConsent locale={locale} />
      </div>
    </CartProvider>
  )
}
