import { useCallback } from 'react'
import { stopAudio } from '../services/audioPlayer'
import useChatStore from '../store/chatStore'

export function useTTS() {
  const setIsSpeaking = useChatStore((s) => s.setIsSpeaking)

  const stop = useCallback(() => {
    stopAudio()
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [setIsSpeaking])

  const speak = useCallback((text) => {
    stop()
    if (!window.speechSynthesis) return

    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const preferred =
      voices.find((v) => v.lang === 'en-US' && v.localService) ||
      voices.find((v) => v.lang.startsWith('en'))
    if (preferred) utterance.voice = preferred
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [stop, setIsSpeaking])

  return { speak, stop }
}