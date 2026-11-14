import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { Tag } from '@/features/videos/server'

type Props = {
  tags: Tag[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

/** 動画に付けるタグを選ぶ(複数選択)。 */
export function TagPicker({ tags, selectedIds, onChange }: Props) {
  if (tags.length === 0) return null

  const toggle = (id: number) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((selected) => selected !== id) : [...selectedIds, id])

  return (
    <div className="flex flex-col gap-2">
      <Label>タグ</Label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = selectedIds.includes(tag.id)
          return (
            <Button
              key={tag.id}
              type="button"
              size="sm"
              variant={selected ? 'default' : 'outline'}
              aria-pressed={selected}
              onClick={() => toggle(tag.id)}
            >
              {tag.name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
