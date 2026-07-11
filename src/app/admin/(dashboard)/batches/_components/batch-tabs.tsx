const TABS = [
  { value: 'in_progress', label: '進行中' },
  { value: 'planned', label: '計画' },
  { value: 'completed', label: '完了' },
] as const

export function BatchTabs({ current }: { current: string }) {
  return (
    <div className="flex gap-2 border-b border-gray-200">
      {TABS.map((tab) => (
        <a
          key={tab.value}
          href={`/admin/batches?status=${tab.value}`}
          className={`px-4 py-3 text-sm font-medium ${
            current === tab.value ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'
          }`}
        >
          {tab.label}
        </a>
      ))}
    </div>
  )
}
