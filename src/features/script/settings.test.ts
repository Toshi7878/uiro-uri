import { expect, it } from 'vitest'
import { DEFAULT_SETTINGS, parseSettings, serializeSettings } from './settings'

it('Cookie に書いた設定を読み戻せ、壊れた値や無い値は既定の設定になる', () => {
  const settings = { showFurigana: false, stealth: true, textSize: 'large' } as const
  const cookie = serializeSettings(settings) // 「名前=値; 属性…」
  const value = cookie.slice(cookie.indexOf('=') + 1, cookie.indexOf(';'))

  expect(parseSettings(value)).toEqual(settings) // エンコードされたまま
  expect(parseSettings(decodeURIComponent(value))).toEqual(settings) // 復号済み
  expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS)
  expect(parseSettings('not json')).toEqual(DEFAULT_SETTINGS)
  expect(parseSettings('{"showFurigana":1,"textSize":"huge"}')).toEqual(DEFAULT_SETTINGS)
})
