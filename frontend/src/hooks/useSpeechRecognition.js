import { useRef, useCallback } from 'react'
import useChatStore from '../store/chatStore'

const SILENCE_TIMEOUT_MS = 1200

export function useSpeechRecognition({ onFinalTranscript, onSpeechStart, onAutoStop }) {
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const accumulatedFinalRef = useRef('')
  const isWarmingUpRef = useRef(false)
  const isStoppingRef = useRef(false)

  const setInterimText = useChatStore((s) => s.setInterimText)
  const [isListening, setIsListening] = [
    useRef(false),
    useCallback((val) => { isListeningRef.current = val }, [])
  ]
  const isListeningRef = useRef(false)

  const setListening = useCallback((val) => {
    isListeningRef.current = val
  }, [])

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const stopEngine = useCallback(() => {
    isStoppingRef.current = true
    clearSilenceTimer()
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.onresult = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)
  }, [setListening])

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      const finalText = accumulatedFinalRef.current.trim()
      if (finalText) {
        const textToSend = finalText
        accumulatedFinalRef.current = ''
        setInterimText('')
        stopEngine()
        if (onAutoStop) onAutoStop()
        onFinalTranscript(textToSend)
      }
    }, SILENCE_TIMEOUT_MS)
  }, [onFinalTranscript, onAutoStop, stopEngine, setInterimText])

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported. Please use Chrome.')
      return false
    }

    isStoppingRef.current = false
    accumulatedFinalRef.current = ''
    setInterimText('')

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setListening(true)
      isWarmingUpRef.current = true
      setTimeout(() => { isWarmingUpRef.current = false }, 600)
    }

    recognition.onresult = (event) => {
      if (isStoppingRef.current) return
      if (onSpeechStart) onSpeechStart()

      let interim = ''
      let newFinal = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          newFinal += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (newFinal) {
        accumulatedFinalRef.current += newFinal
        if (!isWarmingUpRef.current) startSilenceTimer()
      }

      setInterimText(accumulatedFinalRef.current + interim)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('STT error:', event.error)
      }
    }

    recognition.onend = () => {
      if (!isStoppingRef.current && recognitionRef.current === recognition) {
        try { recognition.start() } catch { /* already starting */ }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    return true
  }, [startSilenceTimer, onSpeechStart, setInterimText, setListening])

  const stop = useCallback(() => {
    stopEngine()
  }, [stopEngine])

  // Expose isListening as a ref-backed value
  return {
    start,
    stop,
    get isListening() { return isListeningRef.current },
  }
}