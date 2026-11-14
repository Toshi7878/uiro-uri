import type { ReactNode } from 'react'

const RUBY_PATTERN = /\{([^|{}]+)\|([^|{}]+)\}/g

type RubyTextProps = {
  text: string
  showFurigana: boolean
}

export function RubyText({ text, showFurigana }: RubyTextProps) {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of text.matchAll(RUBY_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index))
    }

    const [, kanji, furigana] = match
    if (showFurigana) {
      nodes.push(
        <ruby key={key++}>
          {kanji}
          <rt>{furigana}</rt>
        </ruby>,
      )
    } else {
      nodes.push(<span key={key++}>{kanji}</span>)
    }

    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return <>{nodes}</>
}
