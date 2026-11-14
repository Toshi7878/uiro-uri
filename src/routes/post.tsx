import { createFileRoute, redirect } from '@tanstack/react-router'
import * as v from 'valibot'
import { getCurrentUser } from '@/features/auth/auth-fns'
import { PostPage } from '@/features/post/post-page'
import { getTags } from '@/features/videos/server'
import { YOUTUBE_VIDEO_ID_PATTERN } from '@/features/videos/youtube'

export const Route = createFileRoute('/post')({
  // ログインしていなければ、ログイン画面へ
  beforeLoad: async () => {
    if (!(await getCurrentUser())) throw redirect({ to: '/login' })
  },
  // ?v=動画ID で、その動画を開いた状態にする(管理ページの「編集」から)
  validateSearch: v.object({
    v: v.optional(v.pipe(v.string(), v.regex(YOUTUBE_VIDEO_ID_PATTERN))),
  }),
  loader: () => getTags(),
  component: Post,
})

function Post() {
  const { v: videoId } = Route.useSearch()
  return <PostPage tags={Route.useLoaderData()} initialVideoId={videoId} />
}
