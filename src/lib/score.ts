function lcsLength(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

/** ひらがな同士の一致率(0〜100)。余分に言った文字は減点。 */
export function scoreKana(target: string, spoken: string): number {
  if (!target || !spoken) return 0
  const lcs = lcsLength(target, spoken)
  const recall = lcs / target.length
  const precision = lcs / spoken.length
  return Math.round(recall * Math.min(1, precision + 0.2) * 100)
}

/** お手本のうち、どれだけ読めたか(0〜1)。言いすぎは考慮しない。 */
export function coverage(target: string, spoken: string): number {
  if (!target || !spoken) return 0
  return lcsLength(target, spoken) / target.length
}
