import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PAYMENT_STATUS_LABELS, REGION_LABELS } from '@/lib/domain/enums'
import { PRODUCTION_STATUS_LABELS_ADMIN, type ProductionStatus } from '@/lib/domain/production-status'
import type { PaymentStatus } from '@/lib/domain/payment-status'
import { AdminMemoEditor } from '../_components/admin-memo-editor'
import { PaymentStatusControl } from '../_components/payment-status-control'
import { DelayNotificationButton } from '../_components/delay-notification-button'

export const dynamic = 'force-dynamic'

type OptionSnapshotEntry = { group: string; value: string; delta?: number }

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, customers(name, email, phone)')
    .eq('id', params.id)
    .single()

  if (error || !order) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', params.id)
    .order('line_no', { ascending: true })

  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('*')
    .eq('order_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.ordered_at).toLocaleString('ja-JP')} ・ {REGION_LABELS[order.region] ?? order.region}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
          </span>
          <span className="text-xl font-bold text-gray-900">¥{Number(order.total).toLocaleString()}</span>
        </div>
      </div>

      <PaymentStatusControl orderId={order.id} currentStatus={order.payment_status as PaymentStatus} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">明細</h2>
        <div className="space-y-3">
          {(items ?? []).map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-gray-900">
                  {item.product_name} / {item.variation_name}
                </p>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {PRODUCTION_STATUS_LABELS_ADMIN[item.production_status as ProductionStatus] ??
                    item.production_status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                樹種: {item.wood_species ?? '-'} ・ 単価: ¥{Number(item.unit_price).toLocaleString()}
              </p>
              {item.custom_note && <p className="mt-1 text-sm text-gray-600">特記: {item.custom_note}</p>}
              {Array.isArray(item.options_snapshot) && item.options_snapshot.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-sm text-gray-600">
                  {(item.options_snapshot as OptionSnapshotEntry[]).map((opt, idx) => (
                    <li key={idx}>
                      {opt.group}: {opt.value}
                      {opt.delta ? `(+¥${opt.delta.toLocaleString()})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">配送先</h2>
          <p className="text-sm text-gray-600">{order.ship_name}</p>
          <p className="text-sm text-gray-600">
            {order.ship_postal} {order.ship_address1} {order.ship_address2}
          </p>
          <p className="text-sm text-gray-600">{order.ship_country}</p>
          <p className="text-sm text-gray-600">{order.ship_phone}</p>
          {order.desired_delivery_date && (
            <p className="mt-2 text-sm text-gray-600">希望日: {order.desired_delivery_date}</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">顧客メッセージ・要望</h2>
          <p className="text-sm text-gray-600">{order.customer_message || '(なし)'}</p>
          {order.customer_request && <p className="mt-2 text-sm text-gray-600">要望: {order.customer_request}</p>}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <AdminMemoEditor orderId={order.id} initialMemo={order.admin_memo ?? ''} />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">メール履歴</h2>
          <DelayNotificationButton orderId={order.id} />
        </div>
        {(emailLogs ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">送信履歴はありません。</p>
        ) : (
          <ul className="space-y-2">
            {(emailLogs ?? []).map((log) => (
              <li key={log.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <p className="font-medium text-gray-900">{log.subject}</p>
                <p className="text-xs text-gray-500">
                  {log.status} ・ {new Date(log.created_at).toLocaleString('ja-JP')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
