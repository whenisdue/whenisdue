import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = 'admin_session'

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('Missing ADMIN_SESSION_SECRET')
  return new TextEncoder().encode(secret)
}

async function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false

  try {
    await jwtVerify(token, getSessionSecret())
    return true
  } catch {
    return false
  }
}

// FIX: Next.js 16 requires this to be exported as "proxy"
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginRoute = pathname === '/admin/login'

  if (!isAdminRoute) return NextResponse.next()
  if (isLoginRoute) return NextResponse.next()

  const ok = await isAuthenticated(request)
  if (ok) return NextResponse.next()

  const loginUrl = new URL('/admin/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}