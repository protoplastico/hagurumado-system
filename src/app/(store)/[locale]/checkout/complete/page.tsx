'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { useCart } from '@/lib/store/cart'
import { getEstimatedWaitWeeksForComplete } from '../actions'

export default function CheckoutCompletePage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { order_number?: string }
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const { clearCart } = useCart()
  const [waitWeeks, setWaitWeeks] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const cleared = useRef(false)

  // 決済完了(Stripeからのリダイレクト到達)をもって初めてカートを空にする。
  // 決済失敗・キャンセル時はcancel_urlでチェックアウトへ戻るため、カートは維持される。
  useEffect(() => {
    if (!cleared.current) {
      cleared.current = true
      clearCart()
    }
  }, [clearCart])

  useEffect(() => {
    getEstimatedWaitWeeksForComplete()
      .then(setWaitWeeks)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="mb-6 text-xl font-semibold text-sumi">{dict.checkoutComplete.heading}</h1>

      {searchParams.order_number && (
        <p className="mb-4 text-sm text-sumi">
          {dict.checkoutComplete.orderNumberLabel}: <span className="font-medium">{searchParams.order_number}</span>
        </p>
      )}

      <p className="mb-2 text-sm text-sumi/80">
        {!loading && waitWeeks != null
          ? `${dict.checkoutComplete.waitWeeksPrefix} ${Math.ceil(waitWeeks)} ${dict.checkoutComplete.waitWeeksSuffix}`
          : !loading
            ? dict.checkoutComplete.waitWeeksUnknown
            : ''}
      </p>

      <p className="mb-8 text-sm text-sumi/60">{dict.checkoutComplete.emailNotice}</p>

      <Link href={`/${locale}/products`} className="inline-block border border-sumi/30 px-6 py-3 text-sm text-sumi hover:border-accent hover:text-accent">
        {dict.checkoutComplete.backToShop}
      </Link>
    </div>
  )
}
