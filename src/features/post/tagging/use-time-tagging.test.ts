import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { phrases } from '@/features/script/phrases'
import { DEFAULT_TAG_OFFSET, useTimeTagging } from './use-time-tagging'

/** 補正値を足した、タグの時刻 */
const tagged = (playback: number) => Math.round((playback + DEFAULT_TAG_OFFSET) * 100) / 100

function setup(initialTime = 10) {
  let now = initialTime
  const seekTo = vi.fn()
  const hook = renderHook(() => useTimeTagging({ getCurrentTime: () => now, seekTo }))
  return {
    ...hook,
    seekTo,
    setNow: (value: number) => {
      now = value
    },
  }
}

describe('useTimeTagging', () => {
  it('再生位置に補正値を足してタグを打ち、0 未満にはしない', () => {
    const { result, setNow } = setup(10)
    act(() => result.current.tag())
    expect(result.current.times).toEqual([tagged(10)])

    setNow(0.05)
    act(() => result.current.tag())
    expect(result.current.times[1]).toBe(0)
  })

  it('取り消すと上書き前の値に戻る', () => {
    const { result, setNow } = setup(10)
    act(() => result.current.tag())
    setNow(20)
    act(() => result.current.setCursor(0))
    act(() => result.current.tag())
    act(() => result.current.undo())
    expect(result.current.times[0]).toBe(tagged(10))
  })

  it('取り消すと、取り消したタグの 3 秒前へシークする(0 未満にはしない)', () => {
    const { result, setNow, seekTo } = setup(20)
    act(() => result.current.tag()) // 再生位置 20
    setNow(1)
    act(() => result.current.tag()) // 再生位置 1

    act(() => result.current.undo())
    expect(seekTo).toHaveBeenLastCalledWith(0)
    act(() => result.current.undo())
    expect(seekTo).toHaveBeenLastCalledWith(tagged(20) - 3)
  })

  // 空きスロットは some() に飛ばされる。見落とすと欠けたまま投稿できてしまう
  it('行を飛ばして打つと hasHole になり、埋めると解消する', () => {
    const { result } = setup(1)
    act(() => result.current.setCursor(2))
    act(() => result.current.tag())
    expect(result.current.hasHole).toBe(true)

    act(() => result.current.setCursor(0))
    act(() => result.current.tag())
    act(() => result.current.tag())
    expect(result.current.hasHole).toBe(false)
  })

  it('全体調整は打った行だけをずらす', () => {
    const { result } = setup(5)
    act(() => result.current.setCursor(1))
    act(() => result.current.tag())
    act(() => result.current.setShift(1))
    act(() => result.current.applyShift())
    expect(result.current.times[0]).toBeUndefined()
    expect(result.current.times[1]).toBe(tagged(5) + 1)
  })

  it('最後に打った時刻が終了時刻になり、途中の行までで投稿できる', () => {
    const { result } = setup(1)
    act(() => result.current.tag())
    expect(result.current.canPost).toBe(false) // 開始だけでは終了時刻がない

    act(() => result.current.tag()) // 2 行目の開始
    act(() => result.current.tag()) // 2 行目の終了(= 最後に打った時刻)
    expect(result.current.lineCount).toBe(2)
    expect(result.current.canPost).toBe(true)
  })

  it('全セリフを打つと lineCount が全行になり、それ以上は打てない', () => {
    const { result } = setup(1)
    for (let i = 0; i < phrases.length + 2; i++) act(() => result.current.tag())
    expect(result.current.lineCount).toBe(phrases.length)
    expect(result.current.times).toHaveLength(phrases.length + 1)
  })
})
