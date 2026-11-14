import { auth } from '../src/features/auth/auth.server'

/**
 * 管理者を 1 人作る。公開のサインアップは閉じているので、ログインできるのはここで作ったユーザーだけ。
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD='8 文字以上' pnpm db:create-admin
 */
const username = process.env.ADMIN_USERNAME?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD

if (!username || !password) {
  console.error('ADMIN_USERNAME と ADMIN_PASSWORD を指定してください。')
  process.exit(1)
}
if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
  console.error('ユーザー名は、英数字・アンダースコア・ドットの 3〜30 文字にしてください。')
  process.exit(1)
}
if (password.length < 8) {
  console.error('パスワードは 8 文字以上にしてください。')
  process.exit(1)
}

const ctx = await auth.$context
// better-auth はメールアドレスを必須とするので、ユーザー名から作った内部用のものを入れる(実在のアドレスではない)
const email = `${username}@admin.invalid`
if (await ctx.internalAdapter.findUserByEmail(email)) {
  console.error(`すでに登録されています: ${username}`)
  process.exit(1)
}

const user = await ctx.internalAdapter.createUser(
  { email, name: username, username, displayUsername: username, emailVerified: true },
  { method: 'admin' },
)
await ctx.internalAdapter.linkAccount({
  userId: user.id,
  providerId: 'credential',
  accountId: user.id,
  password: await ctx.password.hash(password),
})
console.log(`管理者を作成しました: ${username}`)
