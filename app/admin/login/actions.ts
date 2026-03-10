'use server'

import { redirect } from 'next/navigation'
import { createAdminSession } from '@/lib/admin-session'

type LoginState = {
  error: string | null
}

export async function loginAdmin(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '')

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return { error: 'Server misconfiguration: ADMIN_PASSWORD is missing.' }
  }

  if (!password) {
    return { error: 'Password is required.' }
  }

  if (password !== adminPassword) {
    return { error: 'Invalid password.' }
  }

  await createAdminSession()
  redirect('/admin')
}