import { createAdminClient } from '@/lib/supabase/admin'
import { getDashboardStats, getTopWoodSpeciesBacklog, getWeeklyThroughputHistory } from '@/lib/domain/dashboard'
import { WeeklyThroughputChart } from './_components/weekly-throughput-chart'
import { WoodSpeciesBacklogChart } from './_components/wood-species-backlog-chart'

// 常にリクエスト時点の最新データを取得する(認証必須の管理画面のため静的化しない)
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()
  const [stats, throughputHistory, woodSpeciesBacklog] = await Promise.all([
    getDashboardStats(supabase),
    getWeeklyThroughputHistory(supabase),
    getTopWoodSpeciesBacklog(supabase),
  ])

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

      {!stats.acceptingOrders && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          受注を停止しています。
          {stats.acceptingOrdersOverrideActive
            ? '(設定画面の手動オーバーライドによる停止)'
            : '(推定待ち週数が閾値を超えたため自動停止)'}
        </div>
      )}
      {stats.acceptingOrders && stats.acceptingOrdersOverrideActive && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          手動オーバーライドが有効です。受注受付フラグは自動判定では変更されません。設定画面で解除できます。
        </div>
      )}

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">週間スループット推移(直近12週)</h2>
          <WeeklyThroughputChart data={throughputHistory} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">樹種別キュー滞留(上位5)</h2>
          <WoodSpeciesBacklogChart data={woodSpeciesBacklog} />
        </section>
      </div>
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
