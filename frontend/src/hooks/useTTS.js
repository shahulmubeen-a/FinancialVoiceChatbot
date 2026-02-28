import { useCallback } from 'react'
import { fetchAndPlay, stopAudio } from '../services/audioPlayer'
import useChatStore from '../store/chatStore'

export function useTTS() {
  const setIsSpeaking = useChatStore((s) => s.setIsSpeaking)

  const stop = useCallback(() => {
    stopAudio()
    setIsSpeaking(false)
  }, [setIsSpeaking])

  const speak = useCallback((text) => {
    stop()

    const browserFallback = (t) => {
      if (!window.speechSynthesis) return
      const utterance = new SpeechSynthesisUtterance(t)
      const voices = window.speechSynthesis.getVoices()
      const preferred =
        voices.find((v) => v.lang === 'en-US' && v.localService) ||
        voices.find((v) => v.lang.startsWith('en'))
      if (preferred) utterance.voice = preferred
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }

    fetchAndPlay(text, null, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onFallback: browserFallback,
    })
  }, [stop, setIsSpeaking])

  return { speak, stop }
}