import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { LocaleSwitcher } from './locale-switcher'
import { CartBadge } from './cart-badge'
import { LogoutButton } from '../account/_components/logout-button'

// TASK-23: ログイン状態に応じて「ログイン」⇔「マイページ/ログアウト」を出し分ける。
export async function StoreHeader({ locale }: { locale: Locale }) {
  const dict = t(locale)
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="border-b border-sumi/10 bg-kinari">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-4 sm:px-4">
        <Link
          href={`/${locale}`}
          className="whitespace-nowrap text-base font-semibold tracking-wide text-sumi sm:text-lg"
        >
          {dict.common.siteName}
        </Link>

        <nav className="flex items-center gap-3 whitespace-nowrap text-xs text-sumi sm:gap-5 sm:text-sm">
          <Link href={`/${locale}/products`} className="hover:text-accent">
            {dict.common.products}
          </Link>
          <Link href={`/${locale}/cart`} aria-label={dict.common.cart} className="relative hover:text-accent">
            <CartIcon />
            <CartBadge />
          </Link>
          {user ? (
            <>
              <Link href={`/${locale}/account`} className="hover:text-accent">
                {dict.common.myPage}
              </Link>
              <LogoutButton locale={locale} label={dict.common.logout} />
            </>
          ) : (
            <Link href={`/${locale}/account/login`} className="hover:text-accent">
              {dict.common.login}
            </Link>
          )}
          <LocaleSwitcher locale={locale} label={dict.common.switchLanguage} />
        </nav>
      </div>
    </header>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4h2l.4 2M7 13h10l3-8H5.4M7 13L5.4 6M7 13l-1.35 4.5A1 1 0 0 0 6.6 19H18M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      />
    </svg>
  )
}
