import { useEffect, useState } from 'react'
import { createStore, useStore } from 'zustand'
import { type ScriptSettings, serializeSettings, type TextSize } from './settings'

type SettingsState = ScriptSettings & {
  setShowFurigana: (value: boolean) => void
  setStealth: (value: boolean) => void
  setTextSize: (value: TextSize) => void
}

/** ストアはページごとに作る(サーバー側の描画で、別のリクエストの設定が混ざらないように、グローバルには置かない)。 */
function createSettingsStore(initial: ScriptSettings) {
  return createStore<SettingsState>()((set) => ({
    ...initial,
    setShowFurigana: (showFurigana) => set({ showFurigana }),
    setStealth: (stealth) => set({ stealth }),
    setTextSize: (textSize) => set({ textSize }),
  }))
}

/**
 * 練習画面の表示設定。初期値はサーバーが Cookie から読んだもので、変更すると Cookie に保存する。
 * 保存できなくても(Cookie が使えなくても)動作には影響しない。
 */
export function useScriptSettings(initial: ScriptSettings) {
  const [store] = useState(() => createSettingsStore(initial))

  useEffect(
    () =>
      store.subscribe(({ showFurigana, stealth, textSize }) => {
        document.cookie = serializeSettings({ showFurigana, stealth, textSize })
      }),
    [store],
  )

  return useStore(store)
}
