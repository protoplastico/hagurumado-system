import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PAYMENT_STATUS_LABELS, REGION_LABELS } from '@/lib/domain/enums'
import { CustomerProfileForm, type CustomerProfile } from '../_components/customer-profile-form'
import { CustomerMemoEditor } from '../_components/customer-memo-editor'

export const dynamic = 'force-dynamic'

const EMAIL_TYPE_LABELS: Record<string, string> = {
  order_confirm: '注文確定',
  production_start: '製作開始',
  shipped: '発送完了',
  delay: '遅延通知',
  custom_thread: 'オーダーメイド',
  other: 'その他',
}

const EMAIL_STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  approved: '承認済(送信待ち)',
  sent: '送信済み',
  failed: '失敗',
  discarded: '破棄済み',
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: customer, error } = await supabase.from('customers').select('*').eq('id', params.id).single()
  if (error || !customer) notFound()

  const { data: stats } = await supabase
    .from('customer_stats')
    .select('purchase_count, cancel_count, last_purchased_at, total_spent')
    .eq('customer_id', params.id)
    .single()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, payment_status, region, total, ordered_at')
    .eq('customer_id', params.id)
    .order('ordered_at', { ascending: false })

  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('id, type, status, subject, sent_at, created_at')
    .eq('customer_id', params.id)
    .order('created_at', { ascending: false })

  const profile: CustomerProfile = {
    customerId: customer.id as string,
    email: customer.email as string,
    name: (customer.name as string | null) ?? '',
    phone: (customer.phone as string | null) ?? '',
    postal_code: (customer.postal_code as string | null) ?? '',
    address1: (customer.address1 as string | null) ?? '',
    address2: (customer.address2 as string | null) ?? '',
    country: (customer.country as string | null) ?? '',
    locale: (customer.locale as 'ja' | 'en') ?? 'ja',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name || '(氏名未登録)'}</h1>
        <p className="text-sm text-gray-500">{customer.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="購入回数" value={stats?.purchase_count ?? 0} />
        <StatCard label="キャンセル回数" value={stats?.cancel_count ?? 0} />
        <StatCard
          label="最終購入日"
          value={stats?.last_purchased_at ? new Date(stats.last_purchased_at).toLocaleDateString('ja-JP') : '-'}
        />
        <StatCard label="累計購入額" value={`¥${Number(stats?.total_spent ?? 0).toLocaleString()}`} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">基本情報</h2>
        <CustomerProfileForm profile={profile} />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <CustomerMemoEditor customerId={customer.id as string} initialMemo={(customer.notes as string | null) ?? ''} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">注文履歴</h2>
        {(orders ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">注文履歴はありません。</p>
        ) : (
          <ul className="space-y-2">
            {(orders ?? []).map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900 underline">{order.order_number}</span>
                  <span className="text-gray-500">
                    {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status} ・{' '}
                    {REGION_LABELS[order.region] ?? order.region} ・ ¥{Number(order.total).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(order.ordered_at).toLocaleString('ja-JP')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">メール履歴</h2>
        {(emailLogs ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">送信履歴はありません。</p>
        ) : (
          <ul className="space-y-2">
            {(emailLogs ?? []).map((log) => (
              <li key={log.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">{log.subject}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {EMAIL_STATUS_LABELS[log.status] ?? log.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {EMAIL_TYPE_LABELS[log.type] ?? log.type} ・{' '}
                  {log.sent_at
                    ? `送信: ${new Date(log.sent_at).toLocaleString('ja-JP')}`
                    : `作成: ${new Date(log.created_at).toLocaleString('ja-JP')}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
