import { useEffect, useMemo, useState } from 'react'

const ADVANCE_THRESHOLD = 0.85

import { RubyText } from './components/RubyText'
import { sections } from './data/uirouuri'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { loadTokenizer, spokenToHiragana, targetToHiragana } from './lib/reading'
import { coverage, scoreKana } from './lib/score'

type Tokenizer = Awaited<ReturnType<typeof loadTokenizer>>

function App() {
  const [showFurigana, setShowFurigana] = useState(true)
  const [activeSectionId, setActiveSectionId] = useState<string>('all')
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  const speech = useSpeechRecognition()
  const allPhrases = useMemo(
    () => sections.flatMap((section) => section.phrases.map((phrase) => ({ ...phrase, sectionId: section.id }))),
    [],
  )
  const [consumed, setConsumed] = useState(0)
  const activePhrase = activeIndex === null ? undefined : allPhrases[activeIndex]
  const [tokenizer, setTokenizer] = useState<Tokenizer | null>(null)
  useEffect(() => {
    void loadTokenizer().then(setTokenizer)
  }, [])
  const targetKana = activePhrase ? targetToHiragana(activePhrase.text) : ''
  const fullSpokenKana = tokenizer ? spokenToHiragana(tokenizer, speech.transcript) : ''
  const spokenKana = fullSpokenKana.slice(consumed)
  const score = scoreKana(targetKana, spokenKana)

  // 認識がリセットされたら(開始時など)、消費済みの位置も戻す
  useEffect(() => {
    if (fullSpokenKana.length < consumed) setConsumed(0)
  }, [fullSpokenKana, consumed])

  // 十分読めたら次の行へ自動で進む
  useEffect(() => {
    if (!speech.listening || activeIndex === null) return
    if (coverage(targetKana, spokenKana) < ADVANCE_THRESHOLD) return
    const next = allPhrases[activeIndex + 1]
    if (!next) {
      speech.stop()
      return
    }
    if (activeSectionId !== 'all' && next.sectionId !== activeSectionId) {
      speech.stop()
      return
    }
    setConsumed(fullSpokenKana.length)
    setActiveIndex(activeIndex + 1)
  }, [speech, activeIndex, activeSectionId, allPhrases, targetKana, spokenKana, fullSpokenKana])

  // アクティブ行を画面中央に追従させる
  useEffect(() => {
    document
      .querySelector(`[data-phrase-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeIndex])

  const visibleSections = useMemo(
    () =>
      activeSectionId === 'all'
        ? sections
        : sections.filter((section) => section.id === activeSectionId),
    [activeSectionId],
  )

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeSectionId])

  let phraseIndex = 0

  return (
    <div className="app">
      <header className="header">
        <p className="kicker">滑舌・口上の練習</p>
        <h1>
          <RubyText text="{外郎売|ういろううり}" showFurigana={showFurigana} />
        </h1>
        <p className="lead">全文を文節に分けて表示しています。行を選んで声に出してみてください。</p>
      </header>

      <div className="toolbar">
        <label className="toggle">
          <input
            type="checkbox"
            checked={showFurigana}
            onChange={(event) => setShowFurigana(event.target.checked)}
          />
          ふりがな
        </label>

        <nav className="sections" aria-label="段の切り替え">
          <button
            type="button"
            className={activeSectionId === 'all' ? 'is-active' : ''}
            onClick={() => setActiveSectionId('all')}
          >
            全文
          </button>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSectionId === section.id ? 'is-active' : ''}
              onClick={() => setActiveSectionId(section.id)}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </div>

      <aside className="speech-panel">
        {speech.supported ? (
          <>
            <button
              type="button"
              className={speech.listening ? 'mic is-listening' : 'mic'}
              onClick={speech.listening ? speech.stop : speech.start}
            >
              {speech.listening ? '停止' : '🎤 聞き取り開始'}
            </button>
            <p className="target">お手本: {targetKana || '—'}</p>
            <p className="heard">認識: {spokenKana || '…'}</p>
            {!tokenizer && <p>読み辞書を読み込み中…</p>}
            <p className="score">一致率: {score}%</p>
            {speech.error && <p className="speech-error">エラー: {speech.error}</p>}
          </>
        ) : (
          <p>このブラウザは Web Speech API に対応していません(Chrome / Edge を使用してください)。</p>
        )}
      </aside>

      <main className="script">
        {visibleSections.map((section) => (
          <section key={section.id} className="act">
            <h2>{section.title}</h2>
            <ol className="phrases">
              {section.phrases.map((phrase) => {
                const index = phraseIndex++
                return (
                  <li key={`${section.id}-${index}`}>
                    <button
                      type="button"
                      className={activeIndex === index ? 'phrase is-active' : 'phrase'}
                      data-phrase-index={index}
                      onClick={() => {
                        setActiveIndex(index)
                        setConsumed(fullSpokenKana.length)
                      }}
                    >
                      <span className="index">{index + 1}</span>
                      <span className="text">
                        <RubyText text={phrase.text} showFurigana={showFurigana} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </main>
    </div>
  )
}

export default App
