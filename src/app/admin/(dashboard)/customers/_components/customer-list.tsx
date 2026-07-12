import Link from 'next/link'

export type CustomerListRow = {
  id: string
  name: string | null
  email: string
  purchaseCount: number
  cancelCount: number
  lastPurchasedAt: string | null
  totalSpent: number
}

export function CustomerList({ customers }: { customers: CustomerListRow[] }) {
  if (customers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        該当する顧客がいません。
      </p>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">氏名</th>
              <th className="px-4 py-3">メールアドレス</th>
              <th className="px-4 py-3">購入回数</th>
              <th className="px-4 py-3">キャンセル回数</th>
              <th className="px-4 py-3">最終購入日</th>
              <th className="px-4 py-3">累計購入額</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="font-medium text-gray-900 underline">
                    {c.name ?? '(氏名未登録)'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{c.email}</td>
                <td className="px-4 py-3 text-gray-700">{c.purchaseCount}</td>
                <td className="px-4 py-3 text-gray-700">{c.cancelCount}</td>
                <td className="px-4 py-3 text-gray-500">
                  {c.lastPurchasedAt ? new Date(c.lastPurchasedAt).toLocaleDateString('ja-JP') : '-'}
                </td>
                <td className="px-4 py-3 text-gray-700">¥{c.totalSpent.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/admin/customers/${c.id}`}
            className="block rounded-lg border border-gray-200 bg-white p-4"
          >
            <p className="font-medium text-gray-900">{c.name ?? '(氏名未登録)'}</p>
            <p className="text-sm text-gray-500">{c.email}</p>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
              <span>購入{c.purchaseCount}回 / キャンセル{c.cancelCount}回</span>
              <span>¥{c.totalSpent.toLocaleString()}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              最終購入: {c.lastPurchasedAt ? new Date(c.lastPurchasedAt).toLocaleDateString('ja-JP') : '-'}
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
