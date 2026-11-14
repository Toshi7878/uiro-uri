import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui/button'
import { phrases } from '@/features/script/phrases'
import { draftDb, safely } from './drafts'

/** 未投稿の下書き(このブラウザにだけ保存)の一覧。 */
export function DraftList({ onResume }: { onResume: (videoId: string) => void }) {
  const drafts = useLiveQuery(() => draftDb.drafts.orderBy('updatedAt').reverse().toArray(), [])
  if (!drafts || drafts.length === 0) return null

  return (
    <div className="flex flex-col gap-1 rounded-md border p-3 text-sm">
      <div className="font-medium">未投稿の下書き(このブラウザにだけ保存)</div>
      <ul className="flex flex-col gap-1">
        {drafts.map((draft) => (
          <li key={draft.videoId} className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onResume(draft.videoId)}>
              再開
            </Button>
            <span className="font-mono">{draft.videoId}</span>
            <span className="text-muted-foreground">
              {Math.min(draft.times.filter((t) => t !== undefined).length, phrases.length)} 行 ・{' '}
              {new Date(draft.updatedAt).toLocaleString('ja-JP')}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void safely(() => draftDb.drafts.delete(draft.videoId))}
            >
              削除
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
