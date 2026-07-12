'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/lib/i18n'

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname()
  const otherLocale: Locale = locale === 'ja' ? 'en' : 'ja'

  const segments = pathname.split('/')
  segments[1] = otherLocale
  const href = segments.join('/') || `/${otherLocale}`

  return (
    <Link href={href} className="text-sm text-sumi hover:text-accent">
      {label}
    </Link>
  )
}
