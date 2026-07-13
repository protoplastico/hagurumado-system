'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { useCart } from '@/lib/store/cart'
import { trackEvent } from '@/lib/analytics/ga'
import { WaitWeeksNotice } from '../../_components/wait-weeks-notice'
import { getEstimatedWaitWeeks } from '../actions'

export default function CheckoutCompletePage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { order_number?: string; total?: string }
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const { clearCart } = useCart()
  const [waitWeeks, setWaitWeeks] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const cleared = useRef(false)
  const purchaseTracked = useRef(false)

  // 決済完了(Stripeからのリダイレクト到達)をもって初めてカートを空にする。
  // 決済失敗・キャンセル時はcancel_urlでチェックアウトへ戻るため、カートは維持される。
  useEffect(() => {
    if (!cleared.current) {
      cleared.current = true
      clearCart()
    }
  }, [clearCart])

  // TASK-29: purchase(注文完了時、注文番号・金額)。氏名・住所・メール等の個人情報は含めない。
  useEffect(() => {
    if (purchaseTracked.current || !searchParams.order_number || !searchParams.total) return
    purchaseTracked.current = true
    trackEvent('purchase', {
      transaction_id: searchParams.order_number,
      value: Number(searchParams.total),
      currency: 'JPY',
    })
  }, [searchParams.order_number, searchParams.total])

  useEffect(() => {
    getEstimatedWaitWeeks()
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

      {!loading && <WaitWeeksNotice locale={locale} estimatedWaitWeeks={waitWeeks} className="mb-2 text-sm text-sumi/80" />}

      <p className="mb-8 text-sm text-sumi/60">{dict.checkoutComplete.emailNotice}</p>

      <Link href={`/${locale}/products`} className="inline-block border border-sumi/30 px-6 py-3 text-sm text-sumi hover:border-accent hover:text-accent">
        {dict.checkoutComplete.backToShop}
      </Link>
    </div>
  )
}
