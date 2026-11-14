import { useHotkey } from '@tanstack/react-hotkeys'
import { useState } from 'react'
import { phrases } from '@/features/script/phrases'
import { roundTime } from './time'

export type Times = (number | undefined)[]

type HistoryEntry = { index: number; previous: number | undefined }

/** タグを打つときに再生位置へ足す補正値(秒)の初期値。反応の遅れを見込んで負の値にする。 */
export const DEFAULT_TAG_OFFSET = -0.2

/** 取り消したとき、取り消したタグの何秒前へシークするか */
const UNDO_SEEK_BACK = 3

type Player = {
  getCurrentTime: () => number | undefined
  seekTo: (seconds: number) => void
}

/**
 * セリフごとのタイムタグの状態と操作。
 * S キーでタグを打ち、Ctrl+Z で直前のタグを取り消す。
 */
export function useTimeTagging(player: Player) {
  const [times, setTimes] = useState<Times>([])
  const [cursor, setCursor] = useState(0)
  /** タグを打つときに再生位置へ足す補正値(秒)。反応の遅れを見込んで負の値にする。 */
  const [tagOffset, setTagOffset] = useState(DEFAULT_TAG_OFFSET)
  /** 打ち終えたタグ全体へ足す調整値(秒) */
  const [shift, setShift] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const tag = () => {
    const current = player.getCurrentTime()
    // cursor が phrases.length のときは、最後のセリフの終了時刻を打つ
    if (current === undefined || cursor > phrases.length) return
    const time = roundTime(Math.max(0, current + tagOffset))
    setTimes((prev) => {
      const next = [...prev]
      next[cursor] = time
      return next
    })
    setHistory([...history, { index: cursor, previous: times[cursor] }])
    setCursor(cursor + 1)
  }

  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    // 取り消したタグの少し前から聞き直せるようにシークする
    const undone = times[last.index]
    if (undone !== undefined) player.seekTo(Math.max(0, undone - UNDO_SEEK_BACK))
    setTimes((prev) => {
      const next = [...prev]
      next[last.index] = last.previous
      return next
    })
    setCursor(last.index)
    setHistory(history.slice(0, -1))
  }

  const applyShift = () => {
    setTimes((prev) => prev.map((t) => (t === undefined ? t : roundTime(Math.max(0, t + shift)))))
    setShift(0)
    // ずらした後に戻すと古い値で上書きしてしまうので履歴は捨てる
    setHistory([])
  }

  /** 別の動画を開いたとき(下書きがあればその内容で)状態を入れ替える。 */
  const reset = (state?: { times: Times; cursor: number; tagOffset: number }) => {
    setTimes(state?.times ?? [])
    setCursor(state?.cursor ?? 0)
    if (state) setTagOffset(state.tagOffset)
    setShift(0)
    setHistory([])
  }

  // S でタグを打ち、Ctrl+Z(Mac は Cmd+Z)で直前のタグを取り消す。入力欄の中では反応しない。
  useHotkey('S', tag)
  useHotkey('Mod+Z', undo)
  // ↑↓ で現在行を移動する(最後は「終了時刻」の行)
  const moveCursor = (step: number) => setCursor((current) => Math.min(phrases.length, Math.max(0, current + step)))
  useHotkey('ArrowDown', () => moveCursor(1))
  useHotkey('ArrowUp', () => moveCursor(-1))

  const lastTagged = times.reduce<number>((last, t, i) => (t === undefined ? last : i), -1)
  // 行を飛ばして打つと配列に空きスロットができ、some/every はそれを飛ばすので添字で調べる
  const hasHole = Array.from({ length: lastTagged + 1 }, (_, i) => times[i]).some((t) => t === undefined)

  // 最後に打った時刻が「終了時刻」になる。全セリフでなくても、途中の行までで投稿できる。
  const lineCount = Math.max(0, lastTagged)
  const canPost = lineCount >= 1 && !hasHole

  return {
    times,
    cursor,
    setCursor,
    tagOffset,
    setTagOffset,
    shift,
    setShift,
    canUndo: history.length > 0,
    tag,
    undo,
    applyShift,
    reset,
    lastTagged,
    hasHole,
    /** 収録する行数(最後に打った行の手前まで) */
    lineCount,
    /** 1 行以上あり、途中に抜けがない */
    canPost,
  }
}
