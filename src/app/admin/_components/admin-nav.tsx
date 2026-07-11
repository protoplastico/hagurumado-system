'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'ダッシュボード' },
  { href: '/admin/orders', label: '注文' },
  { href: '/admin/queue', label: '生産キュー' },
  { href: '/admin/batches', label: 'バッチ' },
  { href: '/admin/shipping', label: '発送' },
  { href: '/admin/customers', label: '顧客' },
  { href: '/admin/emails', label: 'メール' },
  { href: '/admin/products', label: '商品' },
  { href: '/admin/settings', label: '設定' },
]

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-md px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminNav() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <span className="text-base font-bold text-gray-900">葉車堂 管理画面</span>
        <button
          type="button"
          aria-label="メニューを開く"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-gray-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {isMenuOpen && (
        <div className="border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setIsMenuOpen(false)} />
        </div>
      )}

      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white p-4 lg:block">
        <p className="mb-4 text-base font-bold text-gray-900">葉車堂 管理画面</p>
        <NavLinks pathname={pathname} />
      </aside>
    </>
  )
}
