'use server'

import { cookies } from 'next/headers'

export async function loginAction(password: string, rememberMe: boolean) {
  const expectedPassword = process.env.LOGIN_PASSWORD || 'ourlovestory'
  
  if (password === expectedPassword) {
    const cookieStore = cookies()
    cookieStore.set('love_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // If remember me is true, session stays active for 30 days
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined,
    })
    return { success: true }
  }
  
  return { success: false, error: 'Password salah! Coba ingat kembali kata sandi cinta kalian.' }
}

export async function logoutAction() {
  const cookieStore = cookies()
  cookieStore.delete('love_session')
  return { success: true }
}
