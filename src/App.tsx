import { useEffect, useMemo, useState } from 'react'
import { RubyText } from './components/RubyText'
import { sections } from './data/uirouuri'

function App() {
  const [showFurigana, setShowFurigana] = useState(true)
  const [activeSectionId, setActiveSectionId] = useState<string>('all')
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

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
                      onClick={() => setActiveIndex(index)}
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
