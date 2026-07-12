import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { isLocale, LOCALES, type Locale } from '@/lib/i18n'
import { CartProvider } from '@/lib/store/cart'
import { StoreHeader } from './_components/store-header'
import { StoreFooter } from './_components/store-footer'
import { SetHtmlLang } from './_components/set-html-lang'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
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
      <div className="flex min-h-screen flex-col bg-kinari text-sumi">
        <SetHtmlLang locale={locale} />
        <StoreHeader locale={locale} />
        <main className="flex-1">{children}</main>
        <StoreFooter locale={locale} />
      </div>
    </CartProvider>
  )
}
