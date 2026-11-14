import type { YouTubePlayer } from 'react-youtube'
import { create } from 'zustand'

/** 選べる再生速度。遅くして聞き取る用なので、通常(1)より遅いものだけ。 */
export const PLAYBACK_RATES = [0.5, 0.75, 1] as const
export type PlaybackRate = (typeof PLAYBACK_RATES)[number]

export type PreviewTarget = {
  videoId: string
  /** 再生を始める位置(秒) */
  startTime: number
  /** 各セリフ(通し番号順)の開始時刻(秒)。行を選んでシークするのに使う。 */
  times: number[]
}

type PreviewState = {
  /** プレビュー中の動画。null なら閉じている。 */
  videoId: string | null
  startTime: number
  times: number[]
  /** 再生速度。動画を切り替えても保つ。 */
  rate: PlaybackRate
  player: YouTubePlayer | null
  prev: PreviewTarget | null
  next: PreviewTarget | null
}

export const usePreviewStore = create<PreviewState>()(() => ({
  videoId: null,
  startTime: 0,
  times: [],
  rate: 1,
  player: null,
  prev: null,
  next: null,
}))

const { getState, setState } = usePreviewStore

/** プレビュー用プレイヤーの操作(コンポーネントの外からも呼べる)。 */
export const previewPlayer = {
  /** 動画を startTime(秒)から再生する。同じ動画なら読み込み直さずシークする。 */
  setPreview({ videoId, startTime, times }: PreviewTarget) {
    const { player, videoId: current } = getState()
    setState({ videoId, startTime, times })
    if (current === videoId) {
      void player?.seekTo(startTime, true)
      void player?.playVideo()
    } else {
      void player?.cueVideoById({ videoId, startSeconds: startTime })
    }
  },

  /** 再生速度を変える。次に再生する動画にも引き継ぐ。 */
  setRate(rate: PlaybackRate) {
    setState({ rate })
    void getState().player?.setPlaybackRate(rate)
  },

  /** 再生速度を次へ切り替える(通常 → 0.75 → 0.5 → 通常 …)。 */
  cycleRate() {
    const { rate } = getState()
    // PLAYBACK_RATES は遅い順なので、1 つ前が「次に遅い速度」
    const index = PLAYBACK_RATES.indexOf(rate)
    previewPlayer.setRate(PLAYBACK_RATES[(index - 1 + PLAYBACK_RATES.length) % PLAYBACK_RATES.length])
  },

  /** 前後に移れる動画(一覧の並びで決まる)。 */
  setNeighbors(prev: PreviewTarget | null, next: PreviewTarget | null) {
    setState({ prev, next })
  },

  /** 再生を止めて、プレビューを閉じる。 */
  clear() {
    const { player } = getState()
    setState({ videoId: null, startTime: 0, times: [], prev: null, next: null })
    void player?.cueVideoById({ videoId: '' })
  },

  /** 再生中なら一時停止し、それ以外(停止中・読み込み済みなど)なら再生する。動画は閉じない。 */
  togglePause() {
    const { player } = getState()
    if (!player) return
    // 1 は YT.PlayerState.PLAYING
    if (player.getPlayerState() === 1) void player.pauseVideo()
    else void player.playVideo()
  },

  /** プレビュー中の動画を、index 行目(全体での通し番号)の開始時刻から再生する(一時停止中なら再開)。収録されていない行なら何もしない。 */
  seekToLine(index: number) {
    const { player, times } = getState()
    const time = times[index]
    if (time === undefined) return
    void player?.seekTo(time, true)
    void player?.playVideo()
  },
}
