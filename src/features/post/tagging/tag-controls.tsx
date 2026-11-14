import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { phrases } from '@/features/script/phrases'

type Props = {
  cursor: number
  tagOffset: number
  shift: number
  canUndo: boolean
  canApplyShift: boolean
  onTag: () => void
  onUndo: () => void
  onTagOffsetChange: (value: number) => void
  onShiftChange: (value: number) => void
  onApplyShift: () => void
}

/** タイムタグを打つ・取り消す・補正値と全体調整。 */
export function TagControls(props: Props) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={props.onTag} disabled={props.cursor > phrases.length}>
          {props.cursor === phrases.length ? '終了時刻を打つ (S)' : 'タイムタグを打つ (S)'}
        </Button>
        <Button type="button" variant="outline" onClick={props.onUndo} disabled={!props.canUndo}>
          取り消し (Ctrl+Z)
        </Button>
        <span className="text-sm text-muted-foreground">
          {props.cursor >= phrases.length ? '終了' : `${props.cursor + 1} / ${phrases.length} 行目`}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="tag-offset">補正値 (秒・タグを打つ時に加算)</Label>
          <Input
            id="tag-offset"
            type="number"
            step="0.05"
            className="w-32"
            value={props.tagOffset}
            onChange={(e) => props.onTagOffsetChange(e.target.valueAsNumber || 0)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="shift">全体調整 (秒)</Label>
          <div className="flex gap-2">
            <Input
              id="shift"
              type="number"
              step="0.05"
              className="w-32"
              value={props.shift}
              onChange={(e) => props.onShiftChange(e.target.valueAsNumber || 0)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={props.onApplyShift}
              disabled={props.shift === 0 || !props.canApplyShift}
            >
              全体に適用
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
