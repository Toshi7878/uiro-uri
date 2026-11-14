import { expect, it } from 'vitest'
import { formatDuration } from './format-duration'

it('秒数を m:ss にし、60 秒の繰り上がりも正しく扱う', () => {
  expect(formatDuration(0)).toBe('0:00')
  expect(formatDuration(65.4)).toBe('1:05')
  expect(formatDuration(59.6)).toBe('1:00')
  expect(formatDuration(3725)).toBe('62:05')
})
