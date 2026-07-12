'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { linkAccountAfterAuth } from '../actions'

type Mode = 'login' | 'register'

// TASK-23 S-07: Supabase Auth(メール+パスワード)。登録は確認メールあり。
// 登録・ログインいずれの成功時もlinkAccountAfterAuth()でcustomers.auth_user_idを
// email一致で自動リンクする(過去のゲスト購入・BASE移行顧客との接続、指示書item2)。
export default function AccountLoginPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const supabase = createClient()

    if (mode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(dict.account.loginError)
        setSubmitting(false)
        return
      }
      await linkAccountAfterAuth(locale)
      router.push(`/${locale}/account`)
      router.refresh()
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/${locale}/account/callback` },
    })
    setSubmitting(false)
    if (signUpError) {
      setError(dict.account.registerError)
      return
    }

    if (data.session) {
      // メール確認が無効化されているプロジェクト設定の場合、即座にセッションが張られる
      await linkAccountAfterAuth(locale)
      router.push(`/${locale}/account`)
      router.refresh()
      return
    }

    setRegisterSuccess(true)
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-center text-xl font-semibold text-sumi">
        {mode === 'login' ? dict.account.loginHeading : dict.account.registerHeading}
      </h1>

      {registerSuccess ? (
        <p className="border border-accent/30 bg-kinari-light px-4 py-3 text-center text-sm text-sumi">
          {dict.account.registerSuccess}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-sumi/70">{dict.account.emailLabel}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-sumi/70">{dict.account.passwordLabel}</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
            />
          </label>

          {error && <p className="text-xs text-red-800">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-sumi/30 py-3 text-sm text-sumi transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === 'login' ? dict.account.loginButton : dict.account.registerButton}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError(null)
            }}
            className="block w-full text-center text-xs text-sumi/60 underline hover:text-accent"
          >
            {mode === 'login' ? dict.account.switchToRegister : dict.account.switchToLogin}
          </button>
        </form>
      )}
    </div>
  )
}
