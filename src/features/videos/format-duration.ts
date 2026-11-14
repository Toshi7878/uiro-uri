/** 秒数を「m:ss」にする(1 時間以上でも分で数える)。 */
export function formatDuration(seconds: number) {
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
