import { useCallback, useEffect, useRef, useState } from 'react'

type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: ResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type ResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

function getCtor(): (new () => Recognition) | undefined {
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition
    webkitSpeechRecognition?: new () => Recognition
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function useSpeechRecognition(lang = 'ja-JP') {
  const supported = typeof window !== 'undefined' && getCtor() !== undefined
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<Recognition | null>(null)

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor || recognitionRef.current) return
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let text = ''
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      setTranscript(text)
    }
    recognition.onerror = (event) => setError(event.error)
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }
    setTranscript('')
    setError(null)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [lang])

  const stop = useCallback(() => recognitionRef.current?.stop(), [])
  const reset = useCallback(() => setTranscript(''), [])

  useEffect(() => () => recognitionRef.current?.abort(), [])

  return { supported, listening, transcript, error, start, stop, reset }
}
