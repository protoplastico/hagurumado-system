'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { WoodSpeciesBacklog } from '@/lib/domain/dashboard'

export function WoodSpeciesBacklogChart({ data }: { data: WoodSpeciesBacklog[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
        滞留中のアイテムはありません。
      </div>
    )
  }

  return (
    <div className="h-56 w-full rounded-lg border border-gray-200 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="woodSpecies" tick={{ fontSize: 12 }} width={72} />
          <Tooltip formatter={(value) => [`${value}本`, '滞留数']} />
          <Bar dataKey="count" fill="#78716c" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
