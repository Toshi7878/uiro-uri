import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '@/features/auth/auth-fns'
import { AdminPage } from '@/features/admin/admin-page'
import { getManagedVideos } from '@/features/videos/server'

export const Route = createFileRoute('/admin')({
  // ログインしていなければ、ログイン画面へ
  beforeLoad: async () => {
    if (!(await getCurrentUser())) throw redirect({ to: '/login' })
  },
  loader: () => getManagedVideos(),
  component: Admin,
})

function Admin() {
  return <AdminPage videos={Route.useLoaderData()} />
}
