import { useRef, useState, useCallback } from 'react'

const SILENCE_TIMEOUT_MS = 1000

export function useSpeechRecognition({ onFinalTranscript, onSpeechStart, onAutoStop }) {
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const accumulatedFinalRef = useRef('')
  const isWarmingUpRef = useRef(false)
  const isStoppingRef = useRef(false)        // Bug 2: tracks intentional stop
  const [interimText, setInterimText] = useState('')
  const [isListening, setIsListening] = useState(false)

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  // Stops the recognition engine without wiping the displayed transcript
  const stopEngine = useCallback(() => {
    isStoppingRef.current = true
    clearSilenceTimer()
    if (recognitionRef.current) {
      recognitionRef.current.onend = null   // prevent auto-restart
      recognitionRef.current.onresult = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    // Bug 2: do NOT clear interimText here — keep whatever was spoken visible
  }, [])

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      const finalText = accumulatedFinalRef.current.trim()
      if (finalText) {
        const textToSend = finalText
        // Clear transcript and stop engine before firing callback
        accumulatedFinalRef.current = ''
        setInterimText('')
        stopEngine()
        // Bug 3: notify parent that we auto-stopped
        if (onAutoStop) onAutoStop()
        onFinalTranscript(textToSend)
      }
    }, SILENCE_TIMEOUT_MS)
  }, [onFinalTranscript, onAutoStop, stopEngine])

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
    recognition.maxAlternatives = 1
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      isWarmingUpRef.current = true
      setTimeout(() => { isWarmingUpRef.current = false }, 600)
    }

    recognition.onresult = (event) => {
      // Bug 2: if we're in the middle of intentionally stopping, ignore results
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

      // Show live transcript
      setInterimText(accumulatedFinalRef.current + interim)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('STT error:', event.error)
      }
    }

    recognition.onend = () => {
      // Auto-restart only if not intentionally stopped
      if (!isStoppingRef.current && recognitionRef.current === recognition) {
        try { recognition.start() } catch { /* already starting */ }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    return true
  }, [startSilenceTimer, onSpeechStart])

  // Manual stop from the button — preserve transcript (Bug 2)
  const stop = useCallback(() => {
    stopEngine()
    // intentionally do NOT clear interimText
  }, [stopEngine])

  return { start, stop, isListening, interimText }
}