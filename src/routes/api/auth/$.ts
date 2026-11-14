import { createFileRoute } from '@tanstack/react-router'

// better-auth の API(/api/auth/*)。ログイン・ログアウト・セッションの取得などを受け付ける。
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { auth } = await import('@/features/auth/auth.server')
        return auth.handler(request)
      },
      POST: async ({ request }) => {
        const { auth } = await import('@/features/auth/auth.server')
        return auth.handler(request)
      },
    },
  },
})
