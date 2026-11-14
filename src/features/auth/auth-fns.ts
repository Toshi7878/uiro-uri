import { createServerFn } from '@tanstack/react-start'

/** ログイン中のユーザー(ユーザー名だけ)。ログインしていなければ null。 */
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  const { getSession } = await import('./session.server')
  const session = await getSession()
  return session ? { username: session.user.username ?? null } : null
})
