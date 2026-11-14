/**
 * 動画を再生し始める位置(秒)。文章の行が選ばれていて、その動画にその行の時刻があればそこから、
 * なければ(行が未選択、または収録されていない行なら)読み始め(最初のセリフの開始時刻)から。
 */
export function startTimeOf(times: number[], selectedLine: number | null) {
  const line = selectedLine === null ? undefined : times[selectedLine]
  return line ?? times[0] ?? 0
}
