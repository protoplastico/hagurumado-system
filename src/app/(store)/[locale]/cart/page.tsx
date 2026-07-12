'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { formatPrice } from '@/lib/domain/pricing'
import { useCart } from '@/lib/store/cart'
import { recalculateCart, type CartRecalcResult } from './actions'
import { CartLineItem } from './_components/cart-line-item'

export default function CartPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const { items, hydrated, removeItem, updateQuantity } = useCart()
  const [recalcById, setRecalcById] = useState<Record<string, CartRecalcResult>>({})
  const [loading, setLoading] = useState(true)

  // itemsは配列参照が毎回変わるため、再取得の要否は中身(id構成・数量・選択オプション)から
  // 導いた安定キーで判定する。
  const recalcKey = useMemo(
    () => JSON.stringify(items.map((i) => ({ id: i.id, q: i.quantity, o: i.options.map((o) => o.valueId) }))),
    [items]
  )

  useEffect(() => {
    if (!hydrated) return
    if (items.length === 0) {
      setRecalcById({})
      setLoading(false)
      return
    }
    setLoading(true)
    recalculateCart(
      items.map((i) => ({
        id: i.id,
        productId: i.productId,
        variationId: i.variationId,
        optionValueIds: i.options.map((o) => o.valueId),
      }))
    )
      .then((results) => setRecalcById(Object.fromEntries(results.map((r) => [r.id, r]))))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, recalcKey])

  if (!hydrated || loading) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-sumi/60">{dict.cart.loading}</p>
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4 text-xl font-semibold text-sumi">{dict.cart.heading}</h1>
        <p className="mb-6 text-sm text-sumi/60">{dict.cart.empty}</p>
        <Link href={`/${locale}/products`} className="inline-block border border-sumi/30 px-6 py-3 text-sm text-sumi hover:border-accent hover:text-accent">
          {dict.cart.browse}
        </Link>
      </div>
    )
  }

  const subtotal = items.reduce((sum, item) => {
    const recalc = recalcById[item.id]
    if (!recalc || !recalc.found) return sum
    const optionsDelta =
      locale === 'ja'
        ? recalc.options.reduce((s, o) => s + o.deltaDomestic, 0)
        : recalc.options.reduce((s, o) => s + o.deltaInternational, 0)
    const unitPrice = (locale === 'ja' ? recalc.priceDomestic : recalc.priceInternational) + optionsDelta
    return sum + unitPrice * item.quantity
  }, 0)

  const hasBlockedItem = items.some((item) => {
    const recalc = recalcById[item.id]
    return !recalc || !recalc.found || !recalc.productActive || recalc.variationAccepting === false
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-sumi">{dict.cart.heading}</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <CartLineItem
            key={item.id}
            locale={locale}
            item={item}
            recalc={recalcById[item.id]}
            onRemove={removeItem}
            onQuantityChange={updateQuantity}
          />
        ))}
      </div>

      <div className="mt-8 border-t border-sumi/10 pt-4">
        <div className="flex items-center justify-between text-base font-medium text-sumi">
          <span>{dict.cart.subtotal}</span>
          <span>{formatPrice(subtotal, locale)}</span>
        </div>

        {hasBlockedItem && (
          <p className="mt-3 border border-red-900/20 bg-red-900/5 px-3 py-2 text-xs text-red-900">
            {dict.cart.checkoutBlockedNotice}
          </p>
        )}

        <Link
          href={hasBlockedItem ? '#' : `/${locale}/checkout`}
          aria-disabled={hasBlockedItem}
          className={`mt-4 block w-full border py-3 text-center text-sm ${
            hasBlockedItem
              ? 'pointer-events-none cursor-not-allowed border-sumi/10 text-sumi/40'
              : 'border-sumi/30 text-sumi hover:border-accent hover:text-accent'
          }`}
        >
          {dict.cart.checkout}
        </Link>
      </div>
    </div>
  )
}
