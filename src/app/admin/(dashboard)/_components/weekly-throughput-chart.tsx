'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { WeeklyThroughputPoint } from '@/lib/domain/dashboard'

export function WeeklyThroughputChart({ data }: { data: WeeklyThroughputPoint[] }) {
  if (data.length === 0 || data.every((d) => d.itemCount === 0)) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
        表示できる実績がありません。
      </div>
    )
  }

  return (
    <div className="h-64 w-full rounded-lg border border-gray-200 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
          <Tooltip
            formatter={(value) => [`${value}本`, '検品完了数']}
            labelFormatter={(label) => `週開始 ${label}`}
          />
          <Bar dataKey="itemCount" fill="#111827" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
