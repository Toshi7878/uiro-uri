export function roundTime(seconds: number) {
  return Math.round(seconds * 100) / 100
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  return `${m}:${(seconds % 60).toFixed(2).padStart(5, '0')}`
}
