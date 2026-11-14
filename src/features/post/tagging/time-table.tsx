import { Play } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { RubyText } from '@/features/script/ruby-text'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { phrases } from '@/features/script/phrases'
import { formatTime } from './time'
import type { Times } from './use-time-tagging'

/** 現在行は、背景に加えて内側のボーダーでも示す。 */
const ROW_CLASS =
  'cursor-pointer data-[state=selected]:outline-2 data-[state=selected]:-outline-offset-2 data-[state=selected]:outline-primary'

/** タグを打ち進めたとき、現在行が上から何行目より下に行かないようにする。 */
const FOLLOW_ROW = 5

type Props = {
  times: Times
  cursor: number
  onSelect: (index: number) => void
  /** その行のタイムタグの時刻へシークする */
  onSeek: (index: number) => void
}

function SeekCell({ index, time, onSeek }: { index: number; time: number | undefined; onSeek: (index: number) => void }) {
  return (
    <TableCell className="w-10">
      <button
        type="button"
        disabled={time === undefined}
        className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30"
        aria-label={`${index === phrases.length ? '終了' : `${index + 1}行目`}の時刻へシーク`}
        // クリックは行にも伝わるので、シークと同時にその行も選択される
        onClick={() => onSeek(index)}
      >
        <Play className="size-3.5" />
      </button>
    </TableCell>
  )
}

/** セリフごとのタイムタグ表。行を選ぶと、次にタグを打つ位置になる。 */
export function TimeTable({ times, cursor, onSelect, onSeek }: Props) {
  const endTime = times[phrases.length]
  const scroller = useRef<HTMLDivElement>(null)

  // 現在行が FOLLOW_ROW 行目より下に行く(または画面の上に消える)ときだけ、1 行ずつスクロールして追従する
  useEffect(() => {
    const container = scroller.current
    const row = (index: number) => container?.querySelector<HTMLElement>(`[data-row-index="${index}"]`)
    const current = row(cursor)
    const anchor = row(Math.max(0, cursor - (FOLLOW_ROW - 1)))
    if (!container || !current || !anchor) return

    const containerTop = container.getBoundingClientRect().top
    const currentTop = current.getBoundingClientRect().top - containerTop
    const limit = current.getBoundingClientRect().top - anchor.getBoundingClientRect().top
    if (currentTop > limit || currentTop < 0) {
      container.scrollBy({ top: anchor.getBoundingClientRect().top - containerTop, behavior: 'smooth' })
    }
  }, [cursor])

  return (
    <div ref={scroller} className="lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead className="w-12">#</TableHead>
            <TableHead className="w-24">時刻</TableHead>
            <TableHead>セリフ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {phrases.map((phrase, index) => (
            <TableRow
              key={index}
              data-row-index={index}
              data-state={index === cursor ? 'selected' : undefined}
              className={ROW_CLASS}
              onClick={() => onSelect(index)}
            >
              <SeekCell index={index} time={times[index]} onSeek={onSeek} />
              <TableCell className="text-muted-foreground">
                <button
                  type="button"
                  className="rounded px-1 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  aria-label={`${index + 1}行目を選択`}
                >
                  {index + 1}
                </button>
              </TableCell>
              <TableCell className="font-mono">
                {times[index] === undefined ? '--:--.--' : formatTime(times[index])}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <RubyText text={phrase.text} showFurigana={false} />
              </TableCell>
            </TableRow>
          ))}
          <TableRow
            data-row-index={phrases.length}
            data-state={cursor === phrases.length ? 'selected' : undefined}
            className={ROW_CLASS}
            onClick={() => onSelect(phrases.length)}
          >
            <SeekCell index={phrases.length} time={endTime} onSeek={onSeek} />
            <TableCell className="text-muted-foreground">
              <button
                type="button"
                className="rounded px-1 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label="終了時刻を選択"
              >
                終
              </button>
            </TableCell>
            <TableCell className="font-mono">
              {endTime === undefined ? '--:--.--' : formatTime(endTime)}
            </TableCell>
            <TableCell className="text-muted-foreground">(最後のセリフを読み終えた時刻)</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
