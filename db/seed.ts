import { db } from './index.ts'
import { tags } from './schema.ts'

/** 最初から用意しておくタグ。何度実行しても重複しない。 */
const DEFAULT_TAGS = ['女性声', '男性声']

await db
  .insert(tags)
  .values(DEFAULT_TAGS.map((name) => ({ name })))
  .onConflictDoNothing({ target: tags.name })

console.log(`seeded tags: ${DEFAULT_TAGS.join(', ')}`)
