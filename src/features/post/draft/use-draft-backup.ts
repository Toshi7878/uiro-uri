import { useEffect, useRef } from 'react'
import { draftDb, safely } from './drafts'
import type { Times } from '../tagging/use-time-tagging'

type State = { videoId: string | null; times: Times; cursor: number; tagOffset: number }

/** 未投稿のタイムタグをローカル(IndexedDB)へ自動バックアップする。 */
export function useDraftBackup({ videoId, times, cursor, tagOffset }: State) {
  /** 投稿済みの times。これと同じ間は下書きを保存しない。 */
  const posted = useRef<Times | null>(null)

  useEffect(() => {
    if (!videoId || times === posted.current) return
    if (!times.some((t) => t !== undefined)) return
    safely(() => draftDb.drafts.put({ videoId, times, cursor, tagOffset, updatedAt: Date.now() }))
  }, [videoId, times, cursor, tagOffset])

  return {
    loadDraft: (id: string) => safely(() => draftDb.drafts.get(id)),
    deleteDraft: (id: string) => safely(() => draftDb.drafts.delete(id)),
    /** 投稿に成功したとき: 下書きを消し、同じ内容を保存し直さない。 */
    markPosted: async (id: string, postedTimes: Times) => {
      posted.current = postedTimes
      await safely(() => draftDb.drafts.delete(id))
    },
    /** DB から読み込んだ内容は、手を加えるまで下書きとして保存しない。 */
    markPristine: (loadedTimes: Times) => {
      posted.current = loadedTimes
    },
    /** 別の動画を開いたとき */
    clearPosted: () => {
      posted.current = null
    },
  }
}
