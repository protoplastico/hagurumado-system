import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { formatPrice } from '@/lib/domain/pricing'
import { aggregateOrderProgress } from '@/lib/domain/order-progress'

export const dynamic = 'force-dynamic'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  return { title: t(locale).account.myPageHeading }
}

type OrderRow = {
  id: string
  order_number: string
  ordered_at: string
  total: number
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled'
  locale: 'ja' | 'en'
  order_items: { production_status: string }[]
}

// TASK-23 S-08: マイページ(注文履歴一覧)。RLS(customers can read own orders)により
// 自分の注文のみが返る前提でクエリする(admin clientは使わない)。
export default async function AccountPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/account/login`)

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, ordered_at, total, payment_status, locale, order_items(production_status)')
    .order('ordered_at', { ascending: false })
  if (error) throw error

  const orders = (data ?? []) as unknown as OrderRow[]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-sumi">{dict.account.myPageHeading}</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-sumi/60">{dict.account.orderHistoryEmpty}</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/${locale}/account/orders/${order.id}`}
              className="block border border-sumi/10 bg-kinari-light p-4 transition-colors hover:border-accent"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-sumi">
                    {dict.account.orderNumberLabel}: {order.order_number}
                  </p>
                  <p className="mt-1 text-xs text-sumi/60">
                    {new Date(order.ordered_at).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-sumi">{formatPrice(order.total, locale)}</p>
                  <p className="mt-1 text-xs text-sumi/60">{orderStatusLabel(dict, order)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function orderStatusLabel(dict: ReturnType<typeof t>, order: OrderRow): string {
  if (order.payment_status === 'pending') return dict.account.paymentPendingNotice
  if (order.payment_status === 'cancelled') return dict.account.paymentCancelledNotice
  if (order.payment_status === 'refunded') return dict.account.paymentRefundedNotice

  const stage = aggregateOrderProgress(order.order_items.map((i) => i.production_status))
  switch (stage) {
    case 'received':
      return dict.account.progressReceived
    case 'in_production':
      return dict.account.progressInProduction
    case 'preparing_shipment':
      return dict.account.progressPreparingShipment
    case 'shipped':
      return dict.account.progressShipped
    case 'delivered':
      return dict.account.progressDelivered
    default:
      return ''
  }
}
