import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { username } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '../../../db'
import * as schema from '../../../db/schema'

/**
 * 管理者ログイン(ユーザー名とパスワード)。サーバー専用。
 * 管理者は公開のサインアップではなく、`pnpm db:create-admin` で作る。
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  // メールアドレスでのログインは使わない(ユーザー名でのログインだけにする)
  disabledPaths: ['/sign-in/email'],
  // cookie の設定を TanStack Start のレスポンスに反映する。plugins の最後に置く。
  plugins: [username(), tanstackStartCookies()],
})
