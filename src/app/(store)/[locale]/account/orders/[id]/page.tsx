import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { formatPrice } from '@/lib/domain/pricing'
import { aggregateOrderProgress } from '@/lib/domain/order-progress'
import { getTrackingUrl } from '@/lib/domain/tracking'
import type { Carrier } from '@/lib/domain/shipping'
import { OrderProgressBar } from '../../_components/order-progress-bar'

export const dynamic = 'force-dynamic'

type OrderItemRow = {
  id: string
  line_no: number
  product_name: string
  variation_name: string
  options_snapshot: { group: string; value: string; delta: number }[]
  custom_note: string | null
  unit_price: number
  production_status: string
}

type OrderRow = {
  id: string
  order_number: string
  ordered_at: string
  subtotal: number
  shipping_fee: number
  total: number
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled'
  ship_name: string | null
  ship_postal: string | null
  ship_address1: string | null
  ship_address2: string | null
  ship_country: string | null
}

// TASK-23 S-09: 注文詳細(顧客)。RLS(customers can read own orders/order_items/shipments)により
// 他顧客の注文はmaybeSingle()がnullを返す(=notFound())。
export default async function AccountOrderDetailPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/account/login`)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, ordered_at, subtotal, shipping_fee, total, payment_status, ship_name, ship_postal, ship_address1, ship_address2, ship_country')
    .eq('id', params.id)
    .maybeSingle()
  if (orderError) throw orderError
  if (!order) notFound()
  const typedOrder = order as OrderRow

  const [{ data: items, error: itemsError }, { data: shipment, error: shipmentError }] = await Promise.all([
    supabase
      .from('order_items')
      .select('id, line_no, product_name, variation_name, options_snapshot, custom_note, unit_price, production_status')
      .eq('order_id', params.id)
      .order('line_no', { ascending: true }),
    supabase.from('shipments').select('carrier, tracking_number, shipped_at').eq('order_id', params.id).maybeSingle(),
  ])
  if (itemsError) throw itemsError
  if (shipmentError) throw shipmentError

  const orderItems = (items ?? []) as unknown as OrderItemRow[]
  const stage = aggregateOrderProgress(orderItems.map((i) => i.production_status))
  const trackingUrl =
    shipment?.carrier && shipment?.tracking_number ? getTrackingUrl(shipment.carrier as Carrier, shipment.tracking_number) : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`/${locale}/account`} className="text-xs text-sumi/60 hover:text-accent">
        &larr; {dict.account.backToMyPage}
      </Link>

      <h1 className="mb-1 mt-3 text-xl font-semibold text-sumi">{dict.account.orderDetailHeading}</h1>
      <p className="mb-6 text-sm text-sumi/70">
        {dict.account.orderNumberLabel}: {typedOrder.order_number} ・{' '}
        {new Date(typedOrder.ordered_at).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US')}
      </p>

      {typedOrder.payment_status === 'pending' && (
        <p className="mb-6 border border-amber-800/20 bg-amber-800/5 px-3 py-2 text-xs text-amber-800">
          {dict.account.paymentPendingNotice}
        </p>
      )}
      {typedOrder.payment_status === 'cancelled' && (
        <p className="mb-6 border border-red-900/20 bg-red-900/5 px-3 py-2 text-xs text-red-900">
          {dict.account.paymentCancelledNotice}
        </p>
      )}
      {typedOrder.payment_status === 'refunded' && (
        <p className="mb-6 border border-sumi/20 bg-sumi/5 px-3 py-2 text-xs text-sumi">
          {dict.account.paymentRefundedNotice}
        </p>
      )}

      {typedOrder.payment_status === 'paid' && stage && (
        <div className="mb-8 border border-sumi/10 bg-kinari-light p-4">
          <OrderProgressBar locale={locale} currentStage={stage} />
          {stage === 'shipped' && shipment?.tracking_number && (
            <p className="mt-4 text-center text-xs text-sumi/70">
              {dict.account.trackingNumberLabel}: {shipment.tracking_number}
              {trackingUrl && (
                <>
                  {' '}
                  ・{' '}
                  <a href={trackingUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                    {dict.account.trackingLinkCta}
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      )}

      <section className="mb-8">
        <div className="space-y-3">
          {orderItems.map((item) => (
            <div key={item.id} className="border border-sumi/10 bg-kinari-light p-4">
              <p className="text-sm font-medium text-sumi">
                {item.product_name}
                {item.variation_name && ` / ${item.variation_name}`}
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-sumi/60">
                {item.options_snapshot.map((entry, idx) => (
                  <li key={idx}>
                    {entry.group}:{entry.value}
                    {entry.delta !== 0 ? ` (+${formatPrice(entry.delta, locale)})` : ''}
                  </li>
                ))}
              </ul>
              {item.custom_note && <p className="mt-1 text-xs text-sumi/50">{item.custom_note}</p>}
              <p className="mt-2 text-sm text-sumi">{formatPrice(item.unit_price, locale)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 border-t border-sumi/10 pt-4">
        <div className="space-y-1 text-sm text-sumi">
          <div className="flex items-center justify-between">
            <span className="text-sumi/70">{dict.checkout.subtotalLabel}</span>
            <span>{formatPrice(typedOrder.subtotal, locale)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sumi/70">{dict.checkout.shippingFeeLabel}</span>
            <span>{formatPrice(typedOrder.shipping_fee, locale)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-sumi/10 pt-1 text-base font-medium">
            <span>{dict.account.orderTotalLabel}</span>
            <span>{formatPrice(typedOrder.total, locale)}</span>
          </div>
        </div>
      </section>

      <section className="border-t border-sumi/10 pt-4">
        <h2 className="mb-2 text-sm font-semibold text-sumi">{dict.checkout.shippingHeading}</h2>
        <p className="text-sm text-sumi/80">
          {typedOrder.ship_name}
          <br />
          {typedOrder.ship_postal} {typedOrder.ship_address1} {typedOrder.ship_address2}
          <br />
          {typedOrder.ship_country}
        </p>
      </section>
    </div>
  )
}
