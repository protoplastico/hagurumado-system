import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function OptionGroupsPage() {
  const supabase = createAdminClient()

  const { data: groups, error } = await supabase
    .from('option_groups')
    .select('id, code, name_ja, sort_order, is_active')
    .order('sort_order', { ascending: true })
  if (error) throw error

  const { data: values } = await supabase.from('option_values').select('group_id')
  const valueCounts = new Map<string, number>()
  for (const row of (values ?? []) as { group_id: string }[]) {
    valueCounts.set(row.group_id, (valueCounts.get(row.group_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">オプショングループ管理</h1>
          <Link href="/admin/products" className="text-sm text-gray-500 underline">
            商品管理に戻る
          </Link>
        </div>
        <Link
          href="/admin/products/option-groups/new"
          className="flex h-11 items-center rounded-md bg-gray-900 px-4 text-sm font-medium text-white"
        >
          新規グループ作成
        </Link>
      </div>

      {(groups ?? []).length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          オプショングループが登録されていません。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">グループ名</th>
                <th className="px-4 py-3">コード</th>
                <th className="px-4 py-3">選択肢数</th>
                <th className="px-4 py-3">並び順</th>
                <th className="px-4 py-3">状態</th>
              </tr>
            </thead>
            <tbody>
              {(groups ?? []).map((g) => (
                <tr key={g.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/option-groups/${g.id}`}
                      className="font-medium text-gray-900 underline"
                    >
                      {g.name_ja}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{g.code}</td>
                  <td className="px-4 py-3 text-gray-700">{valueCounts.get(g.id as string) ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500">{g.sort_order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        g.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {g.is_active ? '有効' : '無効'}
                    </span>
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
