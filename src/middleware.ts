import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { isLocale, type Locale } from '@/lib/i18n'

const ADMIN_LOGIN_PATH = '/admin/login'
const DEFAULT_LOCALE: Locale = 'ja'

// TASK-18:Accept-Languageヘッダーから優先言語を推定する。ja/en以外(未対応言語)は
// 先頭以外の候補も見て、どれにも一致しなければ既定言語(ja)にフォールバックする。
function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE

  const candidates = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean)

  for (const candidate of candidates) {
    const lang = candidate.split('-')[0]
    if (isLocale(lang)) return lang
  }

  return DEFAULT_LOCALE
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/${detectLocale(request.headers.get('accept-language'))}`
    return NextResponse.redirect(url)
  }

  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminLoginRoute = pathname === ADMIN_LOGIN_PATH

  if (isAdminRoute && !isAdminLoginRoute) {
    const isAdmin = user?.app_metadata?.role === 'admin'

    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = ADMIN_LOGIN_PATH
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
