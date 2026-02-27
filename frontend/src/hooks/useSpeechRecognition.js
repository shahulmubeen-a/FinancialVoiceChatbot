import { useRef, useState, useCallback } from 'react'

const SILENCE_TIMEOUT_MS = 2000  // submit after 2s of silence

export function useSpeechRecognition({ onFinalTranscript }) {
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const [interimText, setInterimText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const hasSpokenRef = useRef(false)

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const startSilenceTimer = useCallback((finalSoFar) => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      if (finalSoFar.trim()) {
        setInterimText('')
        onFinalTranscript(finalSoFar.trim())
      }
    }, SILENCE_TIMEOUT_MS)
  }, [onFinalTranscript])

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

    let accumulatedFinal = ''

    recognition.onstart = () => {
      setIsListening(true)
      hasSpokenRef.current = false
      accumulatedFinal = ''
    }

    recognition.onresult = (event) => {
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
        accumulatedFinal += newFinal
        hasSpokenRef.current = true
        // Reset silence timer every time we get a final chunk
        startSilenceTimer(accumulatedFinal)
      }

      // Show live interim transcript
      setInterimText(accumulatedFinal + interim)
    }

    recognition.onerror = (event) => {
      // 'no-speech' is normal — just means silence, not an error
      if (event.error !== 'no-speech') {
        console.error('STT error:', event.error)
      }
    }

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      // This handles the browser cutting off after ~60s
      if (recognitionRef.current === recognition) {
        try {
          recognition.start()
        } catch {
          // already started — ignore
        }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    return true
  }, [startSilenceTimer])

  const stop = useCallback(() => {
    clearSilenceTimer()
    if (recognitionRef.current) {
      recognitionRef.current.onend = null  // prevent auto-restart
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimText('')
  }, [])

  return { start, stop, isListening, interimText }
}