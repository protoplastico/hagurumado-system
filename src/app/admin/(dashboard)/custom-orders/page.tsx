import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCustomOrderInquiries } from '@/lib/domain/custom-order'
import { StatusBadge } from './_components/status-badge'

export const dynamic = 'force-dynamic'

// A-17: オーダーメイド申込一覧。TASK-37でstatus=new/diagnosingの7日経過警告を追加予定。
export default async function CustomOrdersPage() {
  const supabase = createAdminClient()
  const inquiries = await getCustomOrderInquiries(supabase)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">オーダーメイド申込</h1>

      {inquiries.length === 0 ? (
        <p className="text-sm text-gray-500">申込はまだありません。</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">申込日時</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">お名前</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">メールアドレス</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">言語</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(inquiry.created_at).toLocaleString('ja-JP')}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/custom-orders/${inquiry.id}`} className="font-medium text-gray-900 hover:underline">
                      {inquiry.customer_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{inquiry.customer_email}</td>
                  <td className="px-4 py-2 text-gray-500">{inquiry.locale === 'ja' ? '日本語' : 'English'}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={inquiry.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
