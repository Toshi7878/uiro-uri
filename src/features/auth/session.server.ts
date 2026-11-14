import { getRequestHeaders } from '@tanstack/react-start/server'

/** いまのリクエストのログイン状態。ログインしていなければ null。サーバー専用。 */
export async function getSession() {
  const { auth } = await import('./auth.server')
  return auth.api.getSession({ headers: getRequestHeaders() })
}

/** 管理者としてログインしていることを確認する。していなければ例外を投げる。サーバー専用。 */
export async function requireAdmin() {
  const session = await getSession()
  if (!session) throw new Error('unauthorized')
  return session
}
