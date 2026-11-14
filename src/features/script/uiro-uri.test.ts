import { describe, expect, it } from 'vitest'
import { sections } from './uiro-uri'

describe('台本データ', () => {
  it('ふりがな記法 {漢字|ふりがな} が壊れていない', () => {
    for (const { text } of sections.flatMap((section) => section.phrases)) {
      const stripped = text.replace(/\{[^|{}]+\|[^|{}]+\}/g, '')
      expect(stripped, text).not.toMatch(/[{}|]/)
    }
  })
})
