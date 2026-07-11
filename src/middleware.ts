import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_LOGIN_PATH = '/admin/login'

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl
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
