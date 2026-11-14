import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useServerFn } from '@tanstack/react-start'
import YouTube, { type YouTubePlayer } from 'react-youtube'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { phrases } from '@/features/script/phrases'
import { getVideo, postVideo, type Tag, updateVideo } from '@/features/videos/server'
import { LogoutButton } from '@/features/auth/logout-button'
import { parseYouTubeUrl, YOUTUBE_VIDEO_ID_PATTERN } from '@/features/videos/youtube'
import { DraftList } from './draft/draft-list'
import { releaseIframeFocus, useReleaseIframeFocus } from './player/release-iframe-focus'
import { TagPicker } from './tags/tag-picker'
import { TagControls } from './tagging/tag-controls'
import { TimeTable } from './tagging/time-table'
import { useDraftBackup } from './draft/use-draft-backup'
import { useTimeTagging } from './tagging/use-time-tagging'

/** ←→ キーで動かす秒数 */
const SEEK_STEP = 3

/** 動画を再生しながら、各セリフの開始時刻を打って投稿するページ。 */
export function PostPage({ tags, initialVideoId }: { tags: Tag[]; initialVideoId?: string }) {
  const [urlInput, setUrlInput] = useState('')
  const [videoId, setVideoId] = useState<string | null>(null)
  const [tagIds, setTagIds] = useState<number[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  /** 開いている動画がすでに投稿済み(= 編集中)か */
  const [posted, setPosted] = useState(false)
  const post = useServerFn(postVideo)
  const update = useServerFn(updateVideo)
  const fetchVideo = useServerFn(getVideo)
  const player = useRef<YouTubePlayer | null>(null)

  const tagging = useTimeTagging({
    getCurrentTime: () => player.current?.getCurrentTime(),
    seekTo: (seconds) => void player.current?.seekTo(seconds, true),
  })
  const { times, cursor, tagOffset, lastTagged, hasHole, lineCount, canPost } = tagging
  const backup = useDraftBackup({ videoId, times, cursor, tagOffset })

  const canSubmit = videoId !== null && canPost

  const parseInput = (text: string) => {
    const input = text.trim()
    return YOUTUBE_VIDEO_ID_PATTERN.test(input) ? input : parseYouTubeUrl(input)
  }

  useReleaseIframeFocus()

  /** 再生位置を相対的に動かす。 */
  const seekBy = (seconds: number) => {
    const current = player.current?.getCurrentTime()
    if (current !== undefined) void player.current?.seekTo(Math.max(0, current + seconds), true)
  }
  useHotkey('ArrowLeft', () => seekBy(-SEEK_STEP))
  useHotkey('ArrowRight', () => seekBy(SEEK_STEP))
  useHotkey('Control+ArrowLeft', () => seekBy(-SEEK_STEP))
  useHotkey('Control+ArrowRight', () => seekBy(SEEK_STEP))

  /** その行のタイムタグの時刻へシークする。 */
  const seekToRow = (index: number) => {
    const time = times[index]
    if (time !== undefined) void player.current?.seekTo(time, true)
  }

  // Enter で、選択中の行の時刻から再生する。入力欄と、テーブル以外のボタン(投稿など)では本来の動作を優先する。
  useHotkey(
    'Enter',
    (event) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.closest('input, select, textarea') || (target.closest('button, a') && !target.closest('[data-slot="table"]')))
      ) {
        return
      }
      const time = times[cursor]
      if (time === undefined || !player.current) return
      event.preventDefault()
      void player.current.seekTo(time, true)
      void player.current.playVideo()
    },
    { ignoreInputs: false, preventDefault: false },
  )

  const openVideo = async (id: string) => {
    const [draft, existing] = await Promise.all([
      backup.loadDraft(id),
      fetchVideo({ data: id }).catch((error) => {
        console.warn('failed to load the posted video', error)
        return null
      }),
    ])
    backup.clearPosted()
    setVideoId(id)
    setPosted(existing !== null)
    setTagIds(existing?.tagIds ?? [])

    if (draft) {
      // 手元の下書き(編集の途中)を優先する
      tagging.reset(draft)
      setMessage('保存していた下書きを復元しました')
    } else if (existing) {
      // 終了時刻は「最後に打った時刻」として、開始時刻の続きに並べる
      const loaded = [...existing.times, existing.endTime]
      backup.markPristine(loaded)
      tagging.reset({ times: loaded, cursor: 0, tagOffset: tagging.tagOffset })
      setMessage(`投稿済みの動画を編集しています: ${existing.title}`)
    } else {
      tagging.reset()
      setMessage(null)
    }
  }

  // 管理ページなどから動画を指定して開かれたときは、自動で読み込む
  useEffect(() => {
    // 下書き(IndexedDB)と投稿済みの内容(サーバー)を読み込む外部との同期で、指定された動画が変わるときだけ行う
    // oxlint-disable-next-line react/set-state-in-effect
    if (initialVideoId) void openVideo(initialVideoId)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVideoId])

  const submit = async () => {
    if (!videoId) return
    setSubmitting(true)
    setMessage(null)
    try {
      const save = posted ? update : post
      const saved = await save({
        data: {
          video: {
            id: videoId,
            times: times.slice(0, lineCount) as number[],
            endTime: times[lineCount]!,
          },
          tagIds,
        },
      })
      await backup.markPosted(videoId, times)
      setPosted(true)
      setMessage(`${posted ? '更新しました' : '投稿しました'}: ${saved.title}`)
    } catch (error) {
      setMessage(`保存に失敗しました: ${error instanceof Error ? error.message : error}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-[90rem] items-start gap-4 p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">動画を投稿</h1>
          <nav className="flex gap-4 text-sm">
            <Link to="/admin" className="underline">動画の管理</Link>
            <Link to="/" className="underline">戻る</Link>
            <LogoutButton />
          </nav>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const id = parseInput(urlInput)
            setMessage(id ? null : 'YouTube の URL か動画 ID を入力してください')
            if (id) void openVideo(id)
          }}
        >
          <Input
            placeholder="YouTube の URL または動画 ID(貼り付けると自動で読み込みます)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text')
              const id = parseInput(pasted)
              if (!id) return
              setUrlInput(pasted.trim())
              void openVideo(id)
            }}
          />
          <Button type="submit">読み込む</Button>
        </form>

        <DraftList onResume={(id) => void openVideo(id)} />

        {videoId ? (
          <YouTube
            key={videoId}
            videoId={videoId}
            className="aspect-video w-full bg-black"
            iframeClassName="size-full"
            onReady={(event) => {
              player.current = event.target
            }}
            // 再生・停止のクリックでフォーカスが iframe に移るので、ホットキーが効くようにページ側へ戻す
            onStateChange={() => setTimeout(releaseIframeFocus, 0)}
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-black text-sm text-white/60">
            動画を読み込むとここに表示されます
          </div>
        )}

        {videoId && (
          <>
            <TagControls
              cursor={cursor}
              tagOffset={tagOffset}
              shift={tagging.shift}
              canUndo={tagging.canUndo}
              canApplyShift={lastTagged >= 0}
              onTag={tagging.tag}
              onUndo={tagging.undo}
              onTagOffsetChange={tagging.setTagOffset}
              onShiftChange={tagging.setShift}
              onApplyShift={tagging.applyShift}
            />
            <TagPicker tags={tags} selectedIds={tagIds} onChange={setTagIds} />
            {hasHole && <p className="text-sm text-destructive">途中に未設定の行があります</p>}
            {!hasHole && (
              <p className="text-sm text-muted-foreground">
                {canPost
                  ? `${lineCount} / ${phrases.length} 行を投稿します(最後に打った時刻が終了時刻になります)`
                  : '2 つ以上の時刻を打つと投稿できます(最後に打った時刻が終了時刻になります)'}
              </p>
            )}
            <Button type="button" onClick={submit} disabled={!canSubmit || submitting}>
              {posted ? '更新する' : '投稿する'}
            </Button>
          </>
        )}
        {message && <p className="text-sm">{message}</p>}
      </div>

      <TimeTable times={times} cursor={cursor} onSelect={tagging.setCursor} onSeek={seekToRow} />
    </div>
  )
}
