const SORT_OPTIONS = [
  { value: 'total_spent_desc', label: '累計購入額(高い順)' },
  { value: 'total_spent_asc', label: '累計購入額(低い順)' },
  { value: 'purchase_count_desc', label: '購入回数(多い順)' },
  { value: 'last_purchased_at_desc', label: '最終購入日(新しい順)' },
]

export function CustomerFilters({ defaultQuery, defaultSort }: { defaultQuery?: string; defaultSort?: string }) {
  return (
    <form method="get" className="flex flex-wrap gap-2">
      <input
        type="text"
        name="q"
        defaultValue={defaultQuery}
        placeholder="氏名・メールアドレスで検索"
        className="h-11 flex-1 rounded-md border border-gray-300 px-3 text-sm"
      />
      <select
        name="sort"
        defaultValue={defaultSort ?? 'total_spent_desc'}
        className="h-11 rounded-md border border-gray-300 px-3 text-sm"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button type="submit" className="h-11 rounded-md bg-gray-900 px-4 text-sm font-medium text-white">
        検索
      </button>
    </form>
  )
}
