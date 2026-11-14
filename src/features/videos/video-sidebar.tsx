import { ListVideo } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { phrases } from '@/features/script/phrases'
import { PreviewPlayer } from '@/features/preview/preview-player'
import { previewPlayer, usePreviewStore } from '@/features/preview/preview-store'
import { formatDuration } from './format-duration'
import type { Video } from './server'
import { startTimeOf } from './start-time'
import { getYouTubeThumbnailUrl } from './youtube'

/** 動画を再生するための指定。選ばれている文章の行があれば、その行から始める。 */
const targetOf = (video: Video, selectedLine: number | null) => ({
  videoId: video.id,
  startTime: startTimeOf(video.times, selectedLine),
  times: video.times,
})

type VideoListProps = {
  videos: Video[]
  previewId: string | null
  /** 台本で選ばれている行(全体での通し番号) */
  selectedLine: number | null
  onSelect?: () => void
}

function VideoList({ videos, previewId, selectedLine, onSelect }: VideoListProps) {
  return (
    <ul className="flex flex-1 flex-col overflow-y-auto p-1">
      {videos.length === 0 && <li className="px-2 py-4 text-sm text-muted-foreground">動画が登録されていません</li>}
      {videos.map((video) => (
        <li key={video.id}>
          <button
            type="button"
            data-preview-video-id={video.id}
            onClick={() => {
              previewPlayer.setPreview(targetOf(video, selectedLine))
              onSelect?.()
            }}
            className={`flex w-full items-center gap-2 rounded-md p-1 text-left text-xs hover:bg-sidebar-accent ${
              video.id === previewId ? 'bg-sidebar-accent font-bold' : ''
            }`}
          >
            <img
              src={getYouTubeThumbnailUrl(video.id, 'mqdefault')}
              alt=""
              loading="lazy"
              className="aspect-video w-12 shrink-0 rounded-sm object-cover lg:w-14 xl:w-16"
            />
            <span className="flex min-w-0 flex-col items-start gap-1">
              <span className="line-clamp-2 leading-snug">{video.title}</span>
              <span className="flex flex-wrap items-center gap-1">
                <Badge variant={video.lineCount === phrases.length ? 'default' : 'secondary'}>
                  {video.lineCount === phrases.length ? '全文' : `${video.lineCount}行`}
                </Badge>
                <Badge variant="outline">{formatDuration(video.duration)}</Badge>
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * YouTube 動画の一覧。選ぶと、台本で選んでいる行(なければ読み始め)からプレビューで再生する。
 * 広い画面では右に固定表示し、狭い画面(スマホ)では Sheet で開く。
 */
export function VideoSidebar({ videos, selectedLine }: { videos: Video[]; selectedLine: number | null }) {
  const previewId = usePreviewStore((state) => state.videoId)
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen] = useState(false)

  // プレビューの「前へ・次へ」を、この一覧の並びに合わせる
  useEffect(() => {
    const index = videos.findIndex((video) => video.id === previewId)
    const target = (video: Video | undefined) => (video ? targetOf(video, selectedLine) : null)
    if (index === -1) previewPlayer.setNeighbors(null, null)
    else previewPlayer.setNeighbors(target(videos[index - 1]), target(videos[index + 1]))
  }, [videos, previewId, selectedLine])

  // 前へ・次へで切り替わったとき、選ばれている動画が一覧の中で見えるようにする
  useEffect(() => {
    if (!previewId) return
    document
      .querySelector(`[data-preview-video-id="${previewId}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [previewId, sheetOpen])

  // プレイヤーは 1 つだけ表示する(一覧が Sheet のときは、Sheet の外に浮かべる)
  if (isMobile) {
    return (
      <>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={<Button variant="outline" size="sm" className="fixed top-3 right-3 z-40 bg-background" />}
          >
            <ListVideo />
            動画
          </SheetTrigger>
          <SheetContent side="right" className="gap-0 bg-sidebar p-0 text-sidebar-foreground">
            {/* 見出しは表示しない(スクリーンリーダー向けにだけ残す) */}
            <SheetHeader className="sr-only">
              <SheetTitle>動画</SheetTitle>
              <SheetDescription>練習用の動画の一覧</SheetDescription>
            </SheetHeader>
            <VideoList
              videos={videos}
              previewId={previewId}
              selectedLine={selectedLine}
              onSelect={() => setSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <PreviewPlayer floating />
      </>
    )
  }

  return (
    <aside className="sticky top-0 hidden h-svh w-48 shrink-0 lg:w-60 xl:w-72 flex-col border-l bg-sidebar text-sidebar-foreground md:flex">
      <PreviewPlayer />
      <VideoList videos={videos} previewId={previewId} selectedLine={selectedLine} />
    </aside>
  )
}
