import { sql } from 'drizzle-orm'
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const videos = sqliteTable('videos', {
  /** YouTube の動画 ID */
  id: text().primaryKey(),
  title: text().notNull(),
  /** 外郎売の各セリフ(通し番号順)の開始タイムタグ(秒)。 */
  times: text({ mode: 'json' }).$type<number[]>().notNull().default(sql`'[]'`),
  /** 収録しているセリフの行数(先頭から何行目まで)。`times` の長さと同じ。 */
  lineCount: integer().notNull(),
  /** 通しで読むのに必要な時間(秒)。最初のセリフの開始から最後のセリフの終わりまで。 */
  duration: real().notNull(),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type VideoRow = typeof videos.$inferSelect

/** 動画に付けるタグ。 */
export const tags = sqliteTable('tags', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
})

/** 動画とタグの対応(多対多)。 */
export const videoTags = sqliteTable(
  'video_tags',
  {
    videoId: text()
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    tagId: integer()
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.videoId, table.tagId] }), index('video_tags_tag_id_idx').on(table.tagId)],
)

export type TagRow = typeof tags.$inferSelect
export * from './auth-schema'
