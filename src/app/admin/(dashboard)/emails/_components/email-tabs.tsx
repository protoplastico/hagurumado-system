const TABS = [
  { value: 'pending', label: '承認待ち' },
  { value: 'history', label: '送信履歴' },
  { value: 'settings', label: '設定' },
] as const

export function EmailTabs({ current }: { current: string }) {
  return (
    <div className="flex gap-2 border-b border-gray-200">
      {TABS.map((tab) => (
        <a
          key={tab.value}
          href={`/admin/emails?tab=${tab.value}`}
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
