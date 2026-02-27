import { useRef, useCallback } from 'react'
import { fetchTTSAudio } from '../services/api'

export function useTTS() {
  const audioRef = useRef(null)

  const speak = useCallback(async (text) => {
    // Stop anything currently playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    try {
      const url = await fetchTTSAudio(text)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.play()

      // Clean up object URL after playback
      audio.onended = () => {
        URL.revokeObjectURL(url)
        audioRef.current = null
      }
    } catch (err) {
      console.warn('ElevenLabs TTS failed, falling back to browser TTS:', err)

      // Fallback to browser TTS if API fails
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text)
        const voices = window.speechSynthesis.getVoices()
        const preferred = voices.find(
          (v) => v.lang === 'en-US' && v.localService
        ) || voices.find((v) => v.lang.startsWith('en'))
        if (preferred) utterance.voice = preferred
        window.speechSynthesis.speak(utterance)
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    window.speechSynthesis?.cancel()
  }, [])

  return { speak, stop }
}