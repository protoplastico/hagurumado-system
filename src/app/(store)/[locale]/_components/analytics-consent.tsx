'use client'

import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { t, type Locale } from '@/lib/i18n'
import { GA_CONSENT_STORAGE_KEY, GA_MEASUREMENT_ID, setGaConsent, type GaConsent } from '@/lib/analytics/ga'

// TASK-29: GA4使用の同意バナー。GA_MEASUREMENT_ID未設定(人間がGA4プロパティ作成前)の間は
// バナー自体を出さず、GAスクリプトも一切読み込まない。同意済みの場合のみGoogleAnalyticsを
// マウントする(拒否時はGA無効化、の受入条件を満たす)。
export function AnalyticsConsent({ locale }: { locale: Locale }) {
  const dict = t(locale)
  const [consent, setConsent] = useState<GaConsent>('unset')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(GA_CONSENT_STORAGE_KEY)
    const initial: GaConsent = stored === 'granted' || stored === 'denied' ? stored : 'unset'
    setGaConsent(initial)
    setConsent(initial)
    setHydrated(true)
  }, [])

  if (!GA_MEASUREMENT_ID) return null

  function choose(next: 'granted' | 'denied') {
    window.localStorage.setItem(GA_CONSENT_STORAGE_KEY, next)
    setGaConsent(next)
    setConsent(next)
  }

  return (
    <>
      {consent === 'granted' && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
      {hydrated && consent === 'unset' && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-sumi/10 bg-kinari px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-sumi/80">{dict.cookieBanner.message}</p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => choose('denied')}
                className="border border-sumi/30 px-4 py-2 text-xs text-sumi hover:border-accent"
              >
                {dict.cookieBanner.decline}
              </button>
              <button
                type="button"
                onClick={() => choose('granted')}
                className="border border-sumi bg-sumi px-4 py-2 text-xs text-kinari hover:border-accent hover:bg-accent"
              >
                {dict.cookieBanner.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
