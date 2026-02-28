import { useRef, useState, useCallback } from 'react'

const SILENCE_TIMEOUT_MS = 2000

export function useSpeechRecognition({ onFinalTranscript, onSpeechStart }) {
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const accumulatedFinalRef = useRef('')
  const isWarmingUpRef = useRef(false)
  const [interimText, setInterimText] = useState('')
  const [isListening, setIsListening] = useState(false)

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  // Bug 2 fix: only wipe transcript AFTER successful submission, not on stop
  const resetTranscript = useCallback(() => {
    accumulatedFinalRef.current = ''
    setInterimText('')
  }, [])

  const stopRecognition = useCallback(() => {
    clearSilenceTimer()
    if (recognitionRef.current) {
      recognitionRef.current.onend = null  // prevent auto-restart
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    // Bug 2 fix: do NOT wipe interimText here — keep what was spoken visible
  }, [])

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      const finalText = accumulatedFinalRef.current.trim()
      if (finalText) {
        resetTranscript()             // clear transcript only after submission
        stopRecognition()             // Bug 3 fix: auto-stop after each submission
        onFinalTranscript(finalText)
      }
    }, SILENCE_TIMEOUT_MS)
  }, [onFinalTranscript, resetTranscript, stopRecognition])

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported. Please use Chrome.')
      return false
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      accumulatedFinalRef.current = ''
      isWarmingUpRef.current = true
      setTimeout(() => { isWarmingUpRef.current = false }, 600)
    }

    recognition.onresult = (event) => {
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
      // Auto-restart only if still supposed to be listening
      if (recognitionRef.current === recognition) {
        try { recognition.start() } catch { /* already starting */ }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    return true
  }, [startSilenceTimer, onSpeechStart])

  // Public stop — used by the toggle button
  // Bug 2 fix: preserve transcript text, just stop the engine
  const stop = useCallback(() => {
    stopRecognition()
    // Don't reset transcript here — user can see what was captured
  }, [stopRecognition])

  return { start, stop, isListening, interimText }
}