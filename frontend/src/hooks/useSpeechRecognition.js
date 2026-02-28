import { useRef, useState, useCallback } from 'react'

const SILENCE_TIMEOUT_MS = 2000

export function useSpeechRecognition({ onFinalTranscript, onSpeechStart }) {
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const accumulatedFinalRef = useRef('')   // ref instead of local var so it persists across callbacks
  const isWarmingUpRef = useRef(false)
  const [interimText, setInterimText] = useState('')
  const [isListening, setIsListening] = useState(false)

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const resetTranscript = useCallback(() => {
    accumulatedFinalRef.current = ''
    setInterimText('')
  }, [])

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      const finalText = accumulatedFinalRef.current.trim()
      if (finalText) {
        resetTranscript()                  // Bug 2 fix: clear before firing
        onFinalTranscript(finalText)
      }
    }, SILENCE_TIMEOUT_MS)
  }, [onFinalTranscript, resetTranscript])

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.')
      return false
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      accumulatedFinalRef.current = ''
      // Bug 4 fix: brief warmup period — STT engine needs ~600ms to initialise
      // During warmup we accept results but don't start the silence timer
      isWarmingUpRef.current = true
      setTimeout(() => {
        isWarmingUpRef.current = false
      }, 600)
    }

    recognition.onresult = (event) => {
      // Feature 2: interrupt TTS the moment user speaks
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
        if (!isWarmingUpRef.current) {
          startSilenceTimer()
        }
      }

      setInterimText(accumulatedFinalRef.current + interim)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('STT error:', event.error)
      }
    }

    recognition.onend = () => {
      // Auto-restart to keep listening — browser cuts off after ~60s
      if (recognitionRef.current === recognition) {
        try { recognition.start() } catch { /* already starting */ }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    return true
  }, [startSilenceTimer, onSpeechStart])

  const stop = useCallback(() => {
    clearSilenceTimer()
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    resetTranscript()
  }, [resetTranscript])

  return { start, stop, isListening, interimText }
}