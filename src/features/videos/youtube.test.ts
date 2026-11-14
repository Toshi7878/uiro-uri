import { describe, expect, it } from 'vitest'
import { parseYouTubeUrl } from './youtube'

const ID = 'dQw4w9WgXcQ'

describe('parseYouTubeUrl', () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}?t=10`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}`,
  ])('%s から動画 ID を取り出す', (url) => {
    expect(parseYouTubeUrl(url)).toBe(ID)
  })

  it('YouTube 以外のホストや不正な値は受け付けない', () => {
    expect(parseYouTubeUrl(`https://example.com/watch?v=${ID}`)).toBeUndefined()
    expect(parseYouTubeUrl(`https://youtube.com.evil.example/watch?v=${ID}`)).toBeUndefined()
    expect(parseYouTubeUrl('https://www.youtube.com/watch?v=abc$defghij')).toBeUndefined()
    expect(parseYouTubeUrl(ID)).toBeUndefined()
  })
})
