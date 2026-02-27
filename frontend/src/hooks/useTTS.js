import { useRef, useCallback } from 'react'

export function useTTS() {
  const utteranceRef = useRef(null)

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return

    // Cancel anything currently playing
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Prefer a natural-sounding English voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(
      (v) => v.lang === 'en-US' && v.localService
    ) || voices.find((v) => v.lang.startsWith('en'))

    if (preferred) utterance.voice = preferred

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  const isSupported = typeof window !== 'undefined' && !!window.speechSynthesis

  return { speak, stop, isSupported }
}