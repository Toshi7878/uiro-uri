import Dexie, { type EntityTable } from 'dexie'

/** 未投稿のタイムタグのバックアップ(ブラウザの IndexedDB にだけ保存される)。 */
export type Draft = {
  videoId: string
  times: (number | undefined)[]
  cursor: number
  tagOffset: number
  updatedAt: number
}

export const draftDb = new Dexie('uiro-uri') as Dexie & {
  drafts: EntityTable<Draft, 'videoId'>
}

draftDb.version(1).stores({ drafts: 'videoId, updatedAt' })

/** バックアップはブラウザの都合(プライベートモードなど)で失敗しても本体の動作に影響させない。 */
export async function safely<T>(task: () => Promise<T>): Promise<T | undefined> {
  try {
    return await task()
  } catch (error) {
    console.warn('draft backup failed', error)
    return undefined
  }
}
