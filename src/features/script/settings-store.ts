import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ScriptSettings = {
  showFurigana: boolean
  stealth: boolean
  setShowFurigana: (value: boolean) => void
  setStealth: (value: boolean) => void
}

/**
 * 練習画面の表示設定(localStorage に保存)。
 * サーバー側の描画と食い違わないよう、保存値の読み込みは自動では行わない。
 * マウント後に `useScriptSettings.persist.rehydrate()` を呼ぶ。
 */
export const useScriptSettings = create<ScriptSettings>()(
  persist(
    (set) => ({
      showFurigana: true,
      stealth: false,
      setShowFurigana: (showFurigana) => set({ showFurigana }),
      setStealth: (stealth) => set({ stealth }),
    }),
    {
      name: 'script-settings',
      skipHydration: true,
      partialize: ({ showFurigana, stealth }) => ({ showFurigana, stealth }),
    },
  ),
)
