import { Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { deleteVideo, type ManagedVideo } from '@/features/videos/server'
import { LogoutButton } from '@/features/auth/logout-button'
import { VideoTable } from './video-table'

/** 投稿済みの動画の一覧。編集(投稿ページで開く)と削除ができる。 */
export function AdminPage({ videos }: { videos: ManagedVideo[] }) {
  const router = useRouter()
  const remove = useServerFn(deleteVideo)
  const [message, setMessage] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const onDelete = async (video: ManagedVideo) => {
    if (!window.confirm(`「${video.title}」を削除しますか?この操作は取り消せません。`)) return
    setDeletingId(video.id)
    setMessage(null)
    try {
      await remove({ data: { id: video.id } })
      setMessage(`削除しました: ${video.title}`)
      await router.invalidate()
    } catch (error) {
      setMessage(`削除に失敗しました: ${error instanceof Error ? error.message : error}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">動画の管理</h1>
        <nav className="flex gap-4 text-sm">
          <Link to="/post" className="underline">新しく投稿</Link>
          <Link to="/" className="underline">戻る</Link>
          <LogoutButton />
        </nav>
      </div>

      {message && <p className="text-sm">{message}</p>}

      <VideoTable videos={videos} deletingId={deletingId} onDelete={(video) => void onDelete(video)} />
    </div>
  )
}
