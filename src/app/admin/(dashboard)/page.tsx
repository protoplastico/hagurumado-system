import { createAdminClient } from '@/lib/supabase/admin'
import { getDashboardStats } from '@/lib/domain/dashboard'

// 常にリクエスト時点の最新データを取得する(認証必須の管理画面のため静的化しない)
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()
  const stats = await getDashboardStats(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            stats.acceptingOrders ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {stats.acceptingOrders ? '受付中' : '受注休止中'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="新規注文数(24h)" value={stats.newOrdersLast24h} />
        <StatCard label="キュー総数" value={stats.queueTotal} />
        <StatCard
          label="推定待ち週数"
          value={stats.estimatedWaitWeeks != null ? stats.estimatedWaitWeeks.toFixed(1) : '—'}
        />
        <StatCard label="発送プール数" value={stats.shippingPoolCount} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">工程別仕掛かり数</h2>
        {stats.inProgressByStep.length === 0 ? (
          <p className="text-sm text-gray-500">現在製作中のバッチはありません。</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {stats.inProgressByStep.map((step) => (
              <div key={step.stepNo} className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <p className="text-xs text-gray-500">工程{step.stepNo}</p>
                <p className="text-xl font-bold text-gray-900">{step.itemCount}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">週間スループット推移</h2>
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
          グラフは後続フェーズで実装予定
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
