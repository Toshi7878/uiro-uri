import { createServerFn } from '@tanstack/react-start'
import { parseSettings, SETTINGS_COOKIE } from './settings'

/** リクエストの Cookie から、練習画面の表示設定を読む。 */
export const getScriptSettings = createServerFn({ method: 'GET' }).handler(async () => {
  const { getCookie } = await import('@tanstack/react-start/server')
  return parseSettings(getCookie(SETTINGS_COOKIE))
})
