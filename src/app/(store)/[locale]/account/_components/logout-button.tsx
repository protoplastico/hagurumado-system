'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n'

export function LogoutButton({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  return (
    <button type="button" onClick={handleLogout} className="hover:text-accent">
      {label}
    </button>
  )
}
