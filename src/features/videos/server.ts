import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq } from 'drizzle-orm'
import * as v from 'valibot'
import { tags, videoTags, videos } from '../../../db/schema'
import { phrases } from '../script/phrases'
import { buildYouTubeWatchUrl, YOUTUBE_VIDEO_ID_PATTERN } from './youtube'

const VideoSchema = v.object({
  /** YouTube の動画 ID(URL の `v=` の値) */
  id: v.pipe(v.string(), v.regex(YOUTUBE_VIDEO_ID_PATTERN)),
  title: v.pipe(v.string(), v.trim(), v.nonEmpty()),
  /** 各セリフ(通し番号順)の開始タイムタグ(秒) */
  times: v.array(v.pipe(v.number(), v.finite(), v.minValue(0))),
  /** 収録しているセリフの行数(先頭から何行目まで) */
  lineCount: v.pipe(v.number(), v.integer(), v.minValue(1)),
  /** 読み通すのに必要な時間(秒) */
  duration: v.pipe(v.number(), v.finite(), v.minValue(0)),
})

export type Video = v.InferOutput<typeof VideoSchema>

const PostInputSchema = v.object({
  video: v.pipe(
    v.object({
      id: VideoSchema.entries.id,
      /** 収録した行の開始タイムタグ(秒)。先頭の行から順に、全セリフ以下の行数 */
      times: VideoSchema.entries.times,
      /** 最後に収録した行を読み終えた時刻(秒) */
      endTime: v.pipe(v.number(), v.finite(), v.minValue(0)),
    }),
    v.check(
      ({ times }) => times.length >= 1 && times.length <= phrases.length,
      'times の数は 1 以上、セリフの数以下にしてください',
    ),
    v.check(({ times, endTime }) => endTime > times[0], '終了時刻は開始時刻より後にしてください'),
  ),
  /** 動画に付けるタグの id(`getTags` で取得したもの) */
  tagIds: v.array(v.pipe(v.number(), v.integer())),
})

export type Tag = { id: number; name: string }

/** YouTube の oEmbed から動画タイトルを取得する(API キー不要)。 */
async function fetchYouTubeTitle(id: string): Promise<string> {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(buildYouTubeWatchUrl(id))}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`動画のタイトルを取得できませんでした (HTTP ${response.status})`)
  const { title } = v.parse(v.object({ title: v.pipe(v.string(), v.trim(), v.nonEmpty()) }), await response.json())
  return title
}

export const getVideos = createServerFn({ method: 'GET' }).handler(async (): Promise<Video[]> => {
  try {
    const { db } = await import('../../../db')
    return await db
      .select({ id: videos.id, title: videos.title, times: videos.times, lineCount: videos.lineCount, duration: videos.duration })
      .from(videos)
      // トップページの一覧は、投稿が古い順(同じ時刻なら動画 ID 順で、並びが毎回ぶれないようにする)
      .orderBy(asc(videos.createdAt), asc(videos.id))
  } catch (error) {
    // DB に繋がらなくても練習画面は使えるようにする
    console.error(error)
    return []
  }
})

export const getTags = createServerFn({ method: 'GET' }).handler(async (): Promise<Tag[]> => {
  try {
    const { db } = await import('../../../db')
    return await db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(tags.id)
  } catch (error) {
    console.error(error)
    return []
  }
})

/** 管理者としてログインしていなければ例外を投げる。 */
async function assertAdmin() {
  const { requireAdmin } = await import('../auth/session.server')
  await requireAdmin()
}

/** 動画の開始時刻の並びと終了時刻から、保存する値を組み立てる。 */
function buildTimings({ times, endTime }: { times: number[]; endTime: number }) {
  return {
    times,
    lineCount: times.length,
    duration: Math.round((endTime - times[0]) * 100) / 100,
  }
}

const uniqueTagRows = (videoId: string, tagIds: number[]) =>
  [...new Set(tagIds)].map((tagId) => ({ videoId, tagId }))

export type EditableVideo = {
  id: string
  title: string
  times: number[]
  /** 最後に収録した行を読み終えた時刻(秒) */
  endTime: number
  tagIds: number[]
}

/** 投稿済みの動画を編集用に取得する。未投稿なら null。 */
export const getVideo = createServerFn({ method: 'GET' })
  .validator(VideoSchema.entries.id)
  .handler(async ({ data: id }): Promise<EditableVideo | null> => {
    const { db } = await import('../../../db')
    const [video] = await db.select().from(videos).where(eq(videos.id, id)).limit(1)
    if (!video) return null
    const rows = await db.select({ tagId: videoTags.tagId }).from(videoTags).where(eq(videoTags.videoId, id))
    return {
      id: video.id,
      title: video.title,
      times: video.times,
      endTime: Math.round((video.times[0] + video.duration) * 100) / 100,
      tagIds: rows.map((row) => row.tagId),
    }
  })

/** 投稿。同じ動画は 1 件までで、すでにあるときは拒否する(編集は `updateVideo`)。管理者としてログインしている必要がある。 */
export const postVideo = createServerFn({ method: 'POST' })
  .validator(PostInputSchema)
  .handler(async ({ data }) => {
    await assertAdmin()

    const { db } = await import('../../../db')
    const { id } = data.video
    // 主キー(動画 ID)でも重複は防がれるが、わかりやすいメッセージを返すため先に調べる
    const existing = await db.select({ id: videos.id }).from(videos).where(eq(videos.id, id)).limit(1)
    if (existing.length > 0) throw new Error('この動画はすでに投稿されています')

    const title = await fetchYouTubeTitle(id)
    const row = { id, title, ...buildTimings(data.video) }
    const tagRows = uniqueTagRows(id, data.tagIds)
    // 動画とタグの保存は、全部成功するか全部失敗するかのどちらかにする
    await db.batch([
      db.insert(videos).values(row),
      ...(tagRows.length > 0 ? [db.insert(videoTags).values(tagRows)] : []),
    ])
    return row
  })

/** 投稿済みの動画のタイムタグとタグを書き換える。タイトルは変えない。 */
export const updateVideo = createServerFn({ method: 'POST' })
  .validator(PostInputSchema)
  .handler(async ({ data }) => {
    await assertAdmin()

    const { db } = await import('../../../db')
    const { id } = data.video
    const [existing] = await db.select({ title: videos.title }).from(videos).where(eq(videos.id, id)).limit(1)
    if (!existing) throw new Error('この動画はまだ投稿されていません')

    const timings = buildTimings(data.video)
    const tagRows = uniqueTagRows(id, data.tagIds)
    await db.batch([
      db.update(videos).set(timings).where(eq(videos.id, id)),
      db.delete(videoTags).where(eq(videoTags.videoId, id)),
      ...(tagRows.length > 0 ? [db.insert(videoTags).values(tagRows)] : []),
    ])
    return { id, title: existing.title, ...timings }
  })

export type ManagedVideo = Video & {
  /** 付いているタグの名前 */
  tags: string[]
  /** 投稿した日時(ミリ秒) */
  createdAt: number
}

/** 管理ページ用の一覧(タグと投稿日時つき)。 */
export const getManagedVideos = createServerFn({ method: 'GET' }).handler(async (): Promise<ManagedVideo[]> => {
  try {
    const { db } = await import('../../../db')
    const [rows, tagRows] = await Promise.all([
      db.select().from(videos).orderBy(desc(videos.createdAt)),
      db
        .select({ videoId: videoTags.videoId, name: tags.name })
        .from(videoTags)
        .innerJoin(tags, eq(videoTags.tagId, tags.id))
        .orderBy(tags.id),
    ])
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      times: row.times,
      lineCount: row.lineCount,
      duration: row.duration,
      tags: tagRows.filter((tag) => tag.videoId === row.id).map((tag) => tag.name),
      createdAt: row.createdAt.getTime(),
    }))
  } catch (error) {
    console.error(error)
    return []
  }
})

/** 動画を削除する(付いているタグの対応も一緒に消える)。管理者としてログインしている必要がある。 */
export const deleteVideo = createServerFn({ method: 'POST' })
  .validator(v.object({ id: VideoSchema.entries.id }))
  .handler(async ({ data }) => {
    await assertAdmin()

    const { db } = await import('../../../db')
    await db.batch([
      db.delete(videoTags).where(eq(videoTags.videoId, data.id)),
      db.delete(videos).where(eq(videos.id, data.id)),
    ])
    return { id: data.id }
  })
