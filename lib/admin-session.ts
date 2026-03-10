import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SESSION_COOKIE = 'admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 // 24 hours (Conservative TTL)

type AdminSessionPayload = {
  sub: 'admin'
  role: 'admin'
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('Missing ADMIN_SESSION_SECRET')
  return new TextEncoder().encode(secret)
}

export async function createAdminSession() {
  const secret = getSessionSecret()

  const token = await new SignJWT({
    sub: 'admin',
    role: 'admin',
  } satisfies AdminSessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  try {
    const secret = getSessionSecret()
    const { payload } = await jwtVerify(token, secret)

    if (payload.sub !== 'admin' || payload.role !== 'admin') return null
    return { sub: 'admin', role: 'admin' }
  } catch {
    return null
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }
  return session
}