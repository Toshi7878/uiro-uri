import { expect, it } from 'vitest'
import { startTimeOf } from './start-time'

it('選ばれている行の時刻から。なければ読み始めから', () => {
  const times = [12, 20, 31]
  expect(startTimeOf(times, 1)).toBe(20)
  expect(startTimeOf(times, null)).toBe(12) // 行が未選択
  expect(startTimeOf(times, 5)).toBe(12) // その動画に収録されていない行
  expect(startTimeOf([], 0)).toBe(0)
})
