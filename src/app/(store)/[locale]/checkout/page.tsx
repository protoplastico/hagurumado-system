'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { formatPrice } from '@/lib/domain/pricing'
import { CHECKOUT_COUNTRY_OPTIONS } from '@/lib/domain/checkout-countries'
import { useCart } from '@/lib/store/cart'
import { WaitWeeksNotice } from '../_components/wait-weeks-notice'
import { getMyDefaultShippingInfo } from '../account/actions'
import { recalculateCart, type CartRecalcResult } from '../cart/actions'
import {
  createCheckoutSession,
  createPayPalOrder,
  getEstimatedWaitWeeks,
  getShippingFeePreview,
  type CheckoutItemInput,
} from './actions'

type PaymentMethod = 'stripe' | 'paypal'

type ShippingFormState = {
  name: string
  email: string
  phone: string
  postalCode: string
  address1: string
  address2: string
  country: string
  customerMessage: string
  desiredDeliveryDate: string
}

function initialShippingState(locale: Locale): ShippingFormState {
  return {
    name: '',
    email: '',
    phone: '',
    postalCode: '',
    address1: '',
    address2: '',
    country: locale === 'ja' ? 'JP' : '',
    customerMessage: '',
    desiredDeliveryDate: '',
  }
}

export default function CheckoutPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { cancelled?: string }
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const { items, hydrated } = useCart()

  const [recalcById, setRecalcById] = useState<Record<string, CartRecalcResult>>({})
  const [loadingRecalc, setLoadingRecalc] = useState(true)
  const [shipping, setShipping] = useState<ShippingFormState>(() => initialShippingState(locale))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe')
  const [shippingFee, setShippingFee] = useState<number | null>(null)
  const [loadingFee, setLoadingFee] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [waitWeeks, setWaitWeeks] = useState<number | null>(null)

  useEffect(() => {
    getEstimatedWaitWeeks().then(setWaitWeeks)
  }, [])

  // TASK-23 item6: ログイン済であれば会員情報から配送先を自動入力する(未入力の項目のみ埋める)
  useEffect(() => {
    getMyDefaultShippingInfo().then((info) => {
      if (!info) return
      setShipping((prev) => ({
        ...prev,
        email: prev.email || info.email,
        name: prev.name || info.name || '',
        phone: prev.phone || info.phone || '',
        postalCode: prev.postalCode || info.postalCode || '',
        address1: prev.address1 || info.address1 || '',
        address2: prev.address2 || info.address2 || '',
        country: prev.country || (locale === 'en' ? info.country ?? '' : prev.country),
      }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const recalcKey = useMemo(
    () => JSON.stringify(items.map((i) => ({ id: i.id, q: i.quantity, o: i.options.map((o) => o.valueId) }))),
    [items]
  )

  useEffect(() => {
    if (!hydrated) return
    if (items.length === 0) {
      setRecalcById({})
      setLoadingRecalc(false)
      return
    }
    setLoadingRecalc(true)
    recalculateCart(
      items.map((i) => ({
        id: i.id,
        productId: i.productId,
        variationId: i.variationId,
        optionValueIds: i.options.map((o) => o.valueId),
      }))
    )
      .then((results) => setRecalcById(Object.fromEntries(results.map((r) => [r.id, r]))))
      .finally(() => setLoadingRecalc(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, recalcKey])

  useEffect(() => {
    setLoadingFee(true)
    getShippingFeePreview(locale, locale === 'ja' ? 'JP' : shipping.country || null)
      .then(setShippingFee)
      .finally(() => setLoadingFee(false))
  }, [locale, shipping.country])

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

  const total = subtotal + (shippingFee ?? 0)

  function setField<K extends keyof ShippingFormState>(key: K, value: ShippingFormState[K]) {
    setShipping((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}
    if (!shipping.name.trim()) nextErrors.name = dict.checkout.requiredError
    if (!shipping.email.trim()) nextErrors.email = dict.checkout.requiredError
    if (!shipping.phone.trim()) nextErrors.phone = dict.checkout.requiredError
    if (!shipping.postalCode.trim()) nextErrors.postalCode = dict.checkout.requiredError
    if (!shipping.address1.trim()) nextErrors.address1 = dict.checkout.requiredError
    if (locale === 'en' && !shipping.country.trim()) nextErrors.country = dict.checkout.requiredError
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate() || hasBlockedItem || items.length === 0) return

    setSubmitting(true)
    try {
      const checkoutItems: CheckoutItemInput[] = items.map((item) => ({
        productId: item.productId,
        variationId: item.variationId,
        options: item.options.map((o) => ({ valueId: o.valueId, note: o.note })),
        quantity: item.quantity,
      }))

      const shippingInput = {
        name: shipping.name.trim(),
        email: shipping.email.trim(),
        phone: shipping.phone.trim(),
        postalCode: shipping.postalCode.trim(),
        address1: shipping.address1.trim(),
        address2: shipping.address2.trim(),
        country: locale === 'ja' ? 'JP' : shipping.country,
        customerMessage: shipping.customerMessage,
        desiredDeliveryDate: shipping.desiredDeliveryDate || null,
      }

      // TASK-22: 注文作成ロジック(価格再検証・スナップショット保存)はcreatePendingOrder経由で
      // Stripe/PayPal共通。ここでは決済手段ごとにリダイレクト先を出し分けるだけ。
      if (paymentMethod === 'stripe') {
        const result = await createCheckoutSession({ locale, origin: window.location.origin, items: checkoutItems, shipping: shippingInput })
        if (!result.ok) {
          setSubmitError(result.error)
          setSubmitting(false)
          return
        }
        window.location.href = result.url
      } else {
        const result = await createPayPalOrder({ locale, origin: window.location.origin, items: checkoutItems, shipping: shippingInput })
        if (!result.ok) {
          setSubmitError(result.error)
          setSubmitting(false)
          return
        }
        window.location.href = result.approveUrl
      }
    } catch {
      setSubmitError(dict.checkout.cancelledNotice)
      setSubmitting(false)
    }
  }

  if (!hydrated || loadingRecalc) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-sumi/60">{dict.cart.loading}</p>
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4 text-xl font-semibold text-sumi">{dict.checkout.heading}</h1>
        <p className="mb-6 text-sm text-sumi/60">{dict.checkout.emptyCartNotice}</p>
        <Link href={`/${locale}/products`} className="inline-block border border-sumi/30 px-6 py-3 text-sm text-sumi hover:border-accent hover:text-accent">
          {dict.cart.browse}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold text-sumi">{dict.checkout.heading}</h1>
      <WaitWeeksNotice locale={locale} estimatedWaitWeeks={waitWeeks} className="mb-6 text-xs text-sumi/60" />

      {searchParams.cancelled === '1' && (
        <p className="mb-6 border border-amber-800/20 bg-amber-800/5 px-3 py-2 text-xs text-amber-800">
          {dict.checkout.cancelledNotice}
        </p>
      )}

      {hasBlockedItem && (
        <div className="mb-6 border border-red-900/20 bg-red-900/5 px-3 py-3 text-sm text-red-900">
          <p>{dict.cart.checkoutBlockedNotice}</p>
          <Link href={`/${locale}/cart`} className="mt-2 inline-block font-medium underline">
            {dict.checkout.backToCart}
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-sumi">{dict.checkout.shippingHeading}</h2>
          <div className="space-y-3">
            <Field label={dict.checkout.nameLabel} error={errors.name}>
              <input
                type="text"
                value={shipping.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
              />
            </Field>
            <Field label={dict.checkout.emailLabel} error={errors.email}>
              <input
                type="email"
                value={shipping.email}
                onChange={(e) => setField('email', e.target.value)}
                className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
              />
            </Field>
            <Field label={dict.checkout.phoneLabel} error={errors.phone}>
              <input
                type="tel"
                value={shipping.phone}
                onChange={(e) => setField('phone', e.target.value)}
                className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
              />
            </Field>
            {locale === 'en' && (
              <Field label={dict.checkout.countryLabel} error={errors.country}>
                <select
                  value={shipping.country}
                  onChange={(e) => setField('country', e.target.value)}
                  className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
                >
                  <option value="">-</option>
                  {CHECKOUT_COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.nameEn}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={dict.checkout.postalCodeLabel} error={errors.postalCode}>
              <input
                type="text"
                value={shipping.postalCode}
                onChange={(e) => setField('postalCode', e.target.value)}
                className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
              />
            </Field>
            <Field label={dict.checkout.address1Label} error={errors.address1}>
              <input
                type="text"
                value={shipping.address1}
                onChange={(e) => setField('address1', e.target.value)}
                className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
              />
            </Field>
            <Field label={dict.checkout.address2Label}>
              <input
                type="text"
                value={shipping.address2}
                onChange={(e) => setField('address2', e.target.value)}
                className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
              />
            </Field>
            {locale === 'ja' && (
              <Field label={dict.checkout.desiredDeliveryDateLabel}>
                <input
                  type="date"
                  value={shipping.desiredDeliveryDate}
                  onChange={(e) => setField('desiredDeliveryDate', e.target.value)}
                  className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
                />
              </Field>
            )}
            <Field label={dict.checkout.messageLabel}>
              <textarea
                value={shipping.customerMessage}
                onChange={(e) => setField('customerMessage', e.target.value)}
                rows={3}
                className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
              />
            </Field>
          </div>
        </section>

        <section className="border-t border-sumi/10 pt-4">
          <h2 className="mb-3 text-sm font-semibold text-sumi">{dict.checkout.paymentMethodLabel}</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-sumi">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')}
              />
              {dict.checkout.paymentMethodStripe}
            </label>
            <label className="flex items-center gap-2 text-sm text-sumi">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === 'paypal'}
                onChange={() => setPaymentMethod('paypal')}
              />
              {dict.checkout.paymentMethodPaypal}
            </label>
          </div>
        </section>

        <section className="border-t border-sumi/10 pt-4">
          <h2 className="mb-3 text-sm font-semibold text-sumi">{dict.checkout.orderSummaryHeading}</h2>
          <div className="space-y-1 text-sm text-sumi">
            <div className="flex items-center justify-between">
              <span className="text-sumi/70">{dict.checkout.subtotalLabel}</span>
              <span>{formatPrice(subtotal, locale)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sumi/70">{dict.checkout.shippingFeeLabel}</span>
              <span>{loadingFee || shippingFee == null ? dict.checkout.calculatingFee : formatPrice(shippingFee, locale)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-sumi/10 pt-1 text-base font-medium">
              <span>{dict.checkout.totalLabel}</span>
              <span>{formatPrice(total, locale)}</span>
            </div>
          </div>
        </section>

        {submitError && (
          <p className="border border-red-900/20 bg-red-900/5 px-3 py-2 text-xs text-red-900">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting || hasBlockedItem || loadingFee || shippingFee == null}
          className="w-full border border-sumi/30 py-3 text-sm text-sumi transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? dict.checkout.submitting : dict.checkout.submitButton}
        </button>
      </form>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-sumi/70">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-800">{error}</span>}
    </label>
  )
}
