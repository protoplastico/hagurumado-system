'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { linkAccountAfterAuth } from '../actions'

// TASK-23 S-07: 確認メール内リンクのリダイレクト先。@supabase/ssrのブラウザクライアントは
// URL中の認証トークンをマウント時に自動検出してセッションを確立する(detectSessionInUrl既定有効)ため、
// ここではセッション確立を待ってlinkAccountAfterAuth()を呼び、マイページへ遷移させるだけでよい。
export default function AccountCallbackPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setStatus('error')
        return
      }
      await linkAccountAfterAuth(locale)
      router.push(`/${locale}/account`)
      router.refresh()
    })
  }, [locale, router])

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p className="mb-6 text-sm text-red-900">{dict.account.callbackError}</p>
        <Link href={`/${locale}/account/login`} className="inline-block border border-sumi/30 px-6 py-3 text-sm text-sumi hover:border-accent hover:text-accent">
          {dict.account.backToLogin}
        </Link>
      </div>
    )
  }

  return <p className="mx-auto max-w-sm px-4 py-16 text-center text-sm text-sumi/60">{dict.account.callbackVerifying}</p>
}
