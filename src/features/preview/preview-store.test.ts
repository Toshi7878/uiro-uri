import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { YouTubePlayer } from 'react-youtube'
import { previewPlayer, usePreviewStore } from './preview-store'

const fakePlayer = () => ({
  seekTo: vi.fn(),
  playVideo: vi.fn(),
  pauseVideo: vi.fn(),
  cueVideoById: vi.fn(),
  getPlayerState: vi.fn(() => 1),
  setPlaybackRate: vi.fn(),
})

describe('previewPlayer.setPreview', () => {
  let player: ReturnType<typeof fakePlayer>
  beforeEach(() => {
    player = fakePlayer()
    usePreviewStore.setState({ videoId: null, startTime: 0, player: player as unknown as YouTubePlayer })
  })

  it('別の動画は読み込み、同じ動画は読み込み直さずにシークして再生する', () => {
    previewPlayer.setPreview({ videoId: 'aaaaaaaaaaa', startTime: 12, times: [12, 20, 31] })
    expect(player.cueVideoById).toHaveBeenCalledWith({ videoId: 'aaaaaaaaaaa', startSeconds: 12 })
    expect(player.seekTo).not.toHaveBeenCalled()

    previewPlayer.setPreview({ videoId: 'aaaaaaaaaaa', startTime: 30, times: [30] })
    expect(player.seekTo).toHaveBeenCalledWith(30, true)
    expect(player.playVideo).toHaveBeenCalled()
    expect(player.cueVideoById).toHaveBeenCalledTimes(1)
  })

  it('行を指定すると、その行の開始時刻から再生する(収録されていない行は何もしない)', () => {
    previewPlayer.setPreview({ videoId: 'aaaaaaaaaaa', startTime: 12, times: [12, 20, 31] })
    previewPlayer.seekToLine(1)
    expect(player.seekTo).toHaveBeenLastCalledWith(20, true)
    expect(player.playVideo).toHaveBeenCalled()

    player.seekTo.mockClear()
    player.playVideo.mockClear()
    previewPlayer.seekToLine(3)
    expect(player.seekTo).not.toHaveBeenCalled()
    expect(player.playVideo).not.toHaveBeenCalled()
  })

  it('togglePause は、再生中なら一時停止し、そうでなければ再生する', () => {
    player.getPlayerState.mockReturnValue(1) // 再生中
    previewPlayer.togglePause()
    expect(player.pauseVideo).toHaveBeenCalledTimes(1)

    player.getPlayerState.mockReturnValue(2) // 一時停止中
    previewPlayer.togglePause()
    expect(player.playVideo).toHaveBeenCalledTimes(1)
  })

  it('再生速度を変えるとプレイヤーに反映し、状態にも覚えておく', () => {
    previewPlayer.setRate(0.5)
    expect(player.setPlaybackRate).toHaveBeenCalledWith(0.5)
    expect(usePreviewStore.getState().rate).toBe(0.5)
  })

  it('cycleRate は 通常 → 0.75 → 0.5 → 通常 の順に切り替える', () => {
    usePreviewStore.setState({ rate: 1 })
    const seen = [1, 2, 3].map(() => {
      previewPlayer.cycleRate()
      return usePreviewStore.getState().rate
    })
    expect(seen).toEqual([0.75, 0.5, 1])
  })
})
