import { usernameClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

/** ブラウザ側からログイン・ログアウトするためのクライアント。 */
export const authClient = createAuthClient({ plugins: [usernameClient()] })
