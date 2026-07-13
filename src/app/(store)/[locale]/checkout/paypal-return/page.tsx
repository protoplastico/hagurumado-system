import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { createAdminClient } from '@/lib/supabase/admin'
import { capturePayPalOrder } from '@/lib/paypal/client'
import { markOrderPaid } from '@/lib/domain/checkout'

export const dynamic = 'force-dynamic'

// TASK-22: PayPal承認後のリダイレクト先。token(=PayPal注文ID)でcapture APIを呼び出し、
// 成功すればpaid化してS-06完了ページへ、失敗すれば注文をpendingのまま残しエラー表示する
// (受入条件「capture失敗時に注文がpendingのまま残り、ユーザーにエラー表示される」)。
export default async function PayPalReturnPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { token?: string }
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const token = searchParams.token

  if (!token) {
    return <ErrorView locale={locale} />
  }

  const supabase = createAdminClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number, payment_status, total')
    .eq('payment_ref', token)
    .eq('payment_method', 'paypal')
    .maybeSingle()
  if (error) throw error
  if (!order) {
    return <ErrorView locale={locale} />
  }

  if (order.payment_status === 'paid') {
    redirect(`/${locale}/checkout/complete?order_number=${encodeURIComponent(order.order_number)}&total=${order.total}`)
  }

  if (order.payment_status !== 'pending') {
    return <ErrorView locale={locale} />
  }

  try {
    const result = await capturePayPalOrder(token)
    if (result.status !== 'COMPLETED' || !result.captureId) {
      return <ErrorView locale={locale} />
    }
    await supabase.from('orders').update({ payment_ref: result.captureId }).eq('id', order.id)
    await markOrderPaid(supabase, order.id)
  } catch {
    return <ErrorView locale={locale} />
  }

  redirect(`/${locale}/checkout/complete?order_number=${encodeURIComponent(order.order_number)}&total=${order.total}`)
}

function ErrorView({ locale }: { locale: Locale }) {
  const dict = t(locale)
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="mb-6 text-sm text-red-900">{dict.checkout.paypalCaptureFailed}</p>
      <Link
        href={`/${locale}/checkout`}
        className="inline-block border border-sumi/30 px-6 py-3 text-sm text-sumi hover:border-accent hover:text-accent"
      >
        {dict.checkout.backToCart}
      </Link>
    </div>
  )
}
