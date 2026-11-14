import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '@/features/auth/auth-fns'
import { LoginPage } from '@/features/auth/login-page'

export const Route = createFileRoute('/login')({
  // すでにログインしているなら、ログイン画面は出さずに管理ページへ
  beforeLoad: async () => {
    if (await getCurrentUser()) throw redirect({ to: '/admin' })
  },
  component: LoginPage,
})
