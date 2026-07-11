import type { ReactNode } from 'react'
import { AdminNav } from '../_components/admin-nav'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <AdminNav />
      <main className="flex-1 p-4 lg:p-8">{children}</main>
    </div>
  )
}
