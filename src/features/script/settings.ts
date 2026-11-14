import * as v from 'valibot'

export const TEXT_SIZES = ['medium', 'large'] as const
export type TextSize = (typeof TEXT_SIZES)[number]

/** 練習画面の表示設定。 */
export type ScriptSettings = {
  showFurigana: boolean
  stealth: boolean
  /** 文章の文字サイズ */
  textSize: TextSize
}

export const DEFAULT_SETTINGS: ScriptSettings = { showFurigana: true, stealth: false, textSize: 'medium' }

/** 設定を保存する Cookie の名前。サーバー側の描画でも読めるよう、localStorage ではなく Cookie に保存する。 */
export const SETTINGS_COOKIE = 'script-settings'

const SettingsSchema = v.object({
  showFurigana: v.boolean(),
  stealth: v.boolean(),
  textSize: v.picklist(TEXT_SIZES),
})

/** Cookie の値を設定に戻す。無い・壊れている・古い形式のときは、既定の設定にする。 */
export function parseSettings(raw: string | undefined): ScriptSettings {
  if (!raw) return DEFAULT_SETTINGS
  for (const candidate of [raw, safeDecode(raw)]) {
    try {
      const parsed = v.safeParse(SettingsSchema, JSON.parse(candidate))
      if (parsed.success) return parsed.output
    } catch {
      // 次の候補を試す
    }
  }
  return DEFAULT_SETTINGS
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** Cookie に書く文字列(1 年間有効)。 */
export function serializeSettings(settings: ScriptSettings) {
  const value = encodeURIComponent(JSON.stringify(settings))
  return `${SETTINGS_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}
