import { useCallback } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSSE } from '../hooks/useSSE'
import { useTTS } from '../hooks/useTTS'
import useChatStore from '../store/chatStore'

export default function VoiceListener() {
  const sessionId = useChatStore((s) => s.sessionId)
  const status = useChatStore((s) => s.status)
  const sttActive = useChatStore((s) => s.sttActive)
  const setSttActive = useChatStore((s) => s.setSttActive)
  const setStatus = useChatStore((s) => s.setStatus)
  const addMessage = useChatStore((s) => s.addMessage)

  const { sendMessage } = useSSE()
  const { stop: stopTTS } = useTTS()

  // Bug 3: called by the hook when silence timer fires and recording auto-stops
  const onAutoStop = useCallback(() => {
    setSttActive(false)
    setStatus('idle')
  }, [setSttActive, setStatus])

  const onFinalTranscript = useCallback(async (text) => {
    if (status === 'thinking' || status === 'speaking') return
    addMessage({ id: Date.now(), role: 'user', text, done: true })
    await sendMessage(sessionId, text)
  }, [status, addMessage, sendMessage, sessionId])

  const { start, stop, isListening, interimText } = useSpeechRecognition({
    onFinalTranscript,
    onSpeechStart: stopTTS,
    onAutoStop,              // Bug 3: sync button state when auto-stopped
  })

  const handleToggle = () => {
    if (!sttActive) {
      const started = start()
      if (started) {
        setSttActive(true)
        setStatus('listening')
      }
    } else {
      stop()
      setSttActive(false)
      setStatus('idle')
    }
  }

  return { interimText, handleToggle, isListening, sttActive }
}