import { useEffect } from 'react'

/**
 * 埋め込みの YouTube(iframe)にフォーカスがあると、キー入力が iframe の中に吸われて
 * ページ側のホットキーが効かない。iframe からフォーカスをページ側へ戻す。
 */
export function releaseIframeFocus() {
  const active = document.activeElement
  if (active instanceof HTMLIFrameElement) active.blur()
}

/** iframe をクリックしてフォーカスが移ったら(ページが blur になる)、すぐページ側へ戻す。 */
export function useReleaseIframeFocus() {
  useEffect(() => {
    // blur の時点では activeElement がまだ切り替わっていないことがあるので 1 tick 待つ
    const onBlur = () => setTimeout(releaseIframeFocus, 0)
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])
}
