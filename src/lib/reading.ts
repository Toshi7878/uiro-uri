import * as kuromoji from '@patdx/kuromoji'

type Tokenizer = Awaited<ReturnType<kuromoji.TokenizerBuilder['build']>>

const DICT_URL = 'https://cdn.jsdelivr.net/npm/@aiktb/kuromoji@1.0.2/dict/'

let tokenizerPromise: Promise<Tokenizer> | undefined

/** 形態素解析器を一度だけ読み込む(辞書は CDN から取得)。 */
export function loadTokenizer(): Promise<Tokenizer> {
  tokenizerPromise ??= new kuromoji.TokenizerBuilder({
    loader: {
      async loadArrayBuffer(url: string) {
        const res = await fetch(DICT_URL + url.replace('.gz', ''))
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
        return res.arrayBuffer()
      },
    },
  }).build()
  return tokenizerPromise
}

const RUBY_PATTERN = /\{([^|{}]+)\|([^|{}]+)\}/g

export function katakanaToHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

/** 記号・空白を除いて、ひらがなだけにそろえる。 */
function cleanKana(text: string): string {
  return katakanaToHiragana(text).replace(/[^ぁ-ゖー]/g, '')
}

/** お手本(`{漢字|ふりがな}` 形式)のひらがな読み。 */
export function targetToHiragana(text: string): string {
  return cleanKana(text.replace(RUBY_PATTERN, '$2'))
}

/** 認識結果(漢字かな交じり)のひらがな読み。 */
export function spokenToHiragana(tokenizer: Tokenizer, text: string): string {
  return cleanKana(
    tokenizer
      .tokenize(text)
      .map((token) => (token.reading && token.reading !== '*' ? token.reading : token.surface_form))
      .join(''),
  )
}
