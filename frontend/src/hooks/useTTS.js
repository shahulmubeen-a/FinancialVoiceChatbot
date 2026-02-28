import { useRef, useCallback } from 'react'
import { fetchTTSAudio } from '../services/api'
import useChatStore from '../store/chatStore'

export function useTTS() {
  const audioRef = useRef(null)
  const abortControllerRef = useRef(null)  // Bug 1 fix
  const setIsSpeaking = useChatStore((s) => s.setIsSpeaking)

  const stop = useCallback(() => {
    // Bug 1 fix: abort the ElevenLabs fetch if still in flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }

    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [setIsSpeaking])

  const speak = useCallback(async (text) => {
    stop()

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const url = await fetchTTSAudio(text, controller.signal)

      // If aborted while fetching, don't play
      if (controller.signal.aborted) {
        URL.revokeObjectURL(url)
        return
      }

      const audio = new Audio(url)
      audioRef.current = audio
      setIsSpeaking(true)

      audio.play()

      audio.onended = () => {
        URL.revokeObjectURL(url)
        audioRef.current = null
        abortControllerRef.current = null
        setIsSpeaking(false)
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        audioRef.current = null
        abortControllerRef.current = null
        setIsSpeaking(false)
      }
    } catch (err) {
      if (err.name === 'AbortError') return  // clean stop, not an error

      console.warn('ElevenLabs TTS failed, falling back to browser TTS:', err)
      setIsSpeaking(false)

      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text)
        const voices = window.speechSynthesis.getVoices()
        const preferred =
          voices.find((v) => v.lang === 'en-US' && v.localService) ||
          voices.find((v) => v.lang.startsWith('en'))
        if (preferred) utterance.voice = preferred
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
      }
    }
  }, [stop, setIsSpeaking])

  return { speak, stop }
}