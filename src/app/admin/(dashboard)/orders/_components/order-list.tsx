import Link from 'next/link'
import { PAYMENT_STATUS_LABELS, REGION_LABELS } from '@/lib/domain/enums'

export type OrderListRow = {
  id: string
  order_number: string
  payment_status: string
  region: string
  source: string
  total: number
  ordered_at: string
  customers: { name: string | null; email: string } | null
}

export function OrderList({ orders }: { orders: OrderListRow[] }) {
  if (orders.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        該当する注文がありません。
      </p>
    )
  }

  return (
    <>
      {/* PC/タブレット(md以上): テーブル表示 */}
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">注文番号</th>
              <th className="px-4 py-3">顧客</th>
              <th className="px-4 py-3">決済</th>
              <th className="px-4 py-3">国内/海外</th>
              <th className="px-4 py-3">合計</th>
              <th className="px-4 py-3">注文日時</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-gray-900 underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{order.customers?.name ?? order.customers?.email ?? '-'}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status} />
                </td>
                <td className="px-4 py-3 text-gray-700">{REGION_LABELS[order.region] ?? order.region}</td>
                <td className="px-4 py-3 text-gray-700">¥{order.total.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(order.ordered_at).toLocaleString('ja-JP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* スマートフォン(md未満): カード表示 */}
      <div className="space-y-3 md:hidden">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="block rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{order.order_number}</span>
              <StatusBadge label={PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status} />
            </div>
            <p className="mt-1 text-sm text-gray-700">{order.customers?.name ?? order.customers?.email ?? '-'}</p>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
              <span>{REGION_LABELS[order.region] ?? order.region}</span>
              <span>¥{order.total.toLocaleString()}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">{new Date(order.ordered_at).toLocaleString('ja-JP')}</p>
          </Link>
        ))}
      </div>
    </>
  )
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      {label}
    </span>
  )
}
