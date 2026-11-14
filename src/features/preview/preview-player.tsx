import { useHotkey } from '@tanstack/react-hotkeys'
import { X } from 'lucide-react'
import YouTube, { type YouTubeEvent } from 'react-youtube'
import { Radio } from '@base-ui/react/radio'
import { buttonVariants } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { PLAYBACK_RATES, type PlaybackRate, previewPlayer, type PreviewTarget, usePreviewStore } from './preview-store'

const BUTTON_CLASS =
  'flex h-8 items-center justify-center rounded bg-black/70 px-2 text-center text-sm text-white hover:bg-black/90 disabled:opacity-30'

/**
 * 動画一覧のプレビュー用プレイヤー。広い画面では右サイドバーの上部に出し、`floating` なら画面の右下に浮かべる。
 * 閉じているときも、すぐ再生できるよう読み込んだままにする。
 */
export function PreviewPlayer({ floating = false }: { floating?: boolean }) {
  const videoId = usePreviewStore((state) => state.videoId)
  const prev = usePreviewStore((state) => state.prev)
  const next = usePreviewStore((state) => state.next)
  const rate = usePreviewStore((state) => state.rate)

  // F10 で再生速度を切り替える(通常 → 0.75 → 0.5 → 通常)
  useHotkey('F10', () => previewPlayer.cycleRate())
  useHotkey('Escape', () => previewPlayer.togglePause(), { enabled: videoId !== null, requireReset: true })

  const onReady = ({ target }: YouTubeEvent) => {
    usePreviewStore.setState({ player: target })
    // 開く前にすでに動画が選ばれていたら、読み込んでおく
    const { videoId: current, startTime } = usePreviewStore.getState()
    if (current) void target.cueVideoById({ videoId: current, startSeconds: startTime })
  }

  const onStateChange = ({ data, target }: YouTubeEvent<number>) => {
    if (data === YouTube.PlayerState.PLAYING) {
      // 動画を切り替えると速度が戻ることがあるので、再生が始まるたびに選んだ速度に合わせる
      const { rate: selected } = usePreviewStore.getState()
      if (target.getPlaybackRate() !== selected) void target.setPlaybackRate(selected)
      return
    }
    if (data !== YouTube.PlayerState.CUED) return
    const { videoId: current, startTime } = usePreviewStore.getState()
    if (!current) return
    // 読み込み直後の seekTo は無視されて 0 秒から再生されることがあるため、開始位置を指定して読み込み直す
    void target.loadVideoById({ videoId: current, startSeconds: startTime })
  }

  const go = (target: PreviewTarget | null) => {
    if (target) previewPlayer.setPreview(target)
  }

  return (
    <div
      className={
        floating
          ? // 一覧が Sheet になる狭い画面では、一覧を閉じても見えるよう、画面の右下に浮かべる(動画がないときは隠す)
            `fixed right-2 bottom-2 z-[60] flex w-60 flex-col gap-1 ${videoId ? '' : 'invisible'}`
          : // サイドバーでは、動画を選ぶ前から同じ高さの場所を確保して、一覧がずれないようにする
            'flex flex-col gap-1 border-b p-2'
      }
    >
      <div className="flex justify-between gap-1">
        <button type="button" className={`${BUTTON_CLASS} flex-1`} disabled={!prev} onClick={() => go(prev)}>
          ↑ 前へ
        </button>
        <button type="button" className={`${BUTTON_CLASS} flex-1`} disabled={!next} onClick={() => go(next)}>
          ↓ 次へ
        </button>
        <button
          type="button"
          className={`${BUTTON_CLASS} w-8 shrink-0 px-0`}
          aria-label="閉じる"
          title="閉じる"
          disabled={!videoId}
          onClick={() => previewPlayer.clear()}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="relative">
        <YouTube
          className="aspect-video w-full bg-black"
          iframeClassName="size-full"
          opts={{ playerVars: { enablejsapi: 1, playsinline: 1, iv_load_policy: 3, modestbranding: 1, rel: 0 } }}
          onReady={onReady}
          onStateChange={onStateChange}
          onEnd={() => {
            const target = usePreviewStore.getState().next
            if (target) previewPlayer.setPreview(target)
            else previewPlayer.clear()
          }}
        />
        {!videoId && (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-xs text-white/60">
            動画を選ぶとここで再生します
          </div>
        )}
      </div>
      <RadioGroup
        value={rate}
        onValueChange={(value) => previewPlayer.setRate(value as PlaybackRate)}
        aria-label="再生速度"
        className="grid grid-cols-3 gap-1"
      >
        {PLAYBACK_RATES.map((option) => (
          // ラジオ(role=radio)のまま、見た目だけボタンにする。選ばれているものは塗りつぶす
          <Radio.Root
            key={option}
            value={option}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-checked:hover:bg-primary',
            )}
          >
            {option === 1 ? '通常' : `${option}x`}
          </Radio.Root>
        ))}
      </RadioGroup>
    </div>
  )
}
