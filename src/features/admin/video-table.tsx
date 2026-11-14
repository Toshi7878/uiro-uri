import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { phrases } from '@/features/script/phrases'
import { formatDuration } from '@/features/videos/format-duration'
import type { ManagedVideo } from '@/features/videos/server'
import { buildYouTubeWatchUrl, getYouTubeThumbnailUrl } from '@/features/videos/youtube'

type Props = {
  videos: ManagedVideo[]
  deletingId: string | null
  onDelete: (video: ManagedVideo) => void
}

export function VideoTable({ videos, deletingId, onDelete }: Props) {
  if (videos.length === 0) return <p className="text-sm text-muted-foreground">動画が登録されていません</p>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>動画</TableHead>
          <TableHead>行数</TableHead>
          <TableHead>時間</TableHead>
          <TableHead>タグ</TableHead>
          <TableHead>投稿日</TableHead>
          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {videos.map((video) => (
          <TableRow key={video.id}>
            <TableCell className="max-w-xs">
              <a
                href={buildYouTubeWatchUrl(video.id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <img
                  src={getYouTubeThumbnailUrl(video.id, 'mqdefault')}
                  alt=""
                  loading="lazy"
                  className="aspect-video w-20 shrink-0 rounded-sm object-cover"
                />
                <span className="line-clamp-2 whitespace-normal">{video.title}</span>
              </a>
            </TableCell>
            <TableCell>
              <Badge variant={video.lineCount === phrases.length ? 'default' : 'secondary'}>
                {video.lineCount === phrases.length ? '全文' : `${video.lineCount}行`}
              </Badge>
            </TableCell>
            <TableCell className="font-mono">{formatDuration(video.duration)}</TableCell>
            <TableCell>
              <span className="flex flex-wrap gap-1">
                {video.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </span>
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {new Date(video.createdAt).toLocaleDateString('ja-JP')}
            </TableCell>
            <TableCell>
              <span className="flex justify-end gap-1">
                <Button variant="outline" size="sm" render={<Link to="/post" search={{ v: video.id }} />}>
                  編集
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={deletingId === video.id}
                  onClick={() => onDelete(video)}
                >
                  削除
                </Button>
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
