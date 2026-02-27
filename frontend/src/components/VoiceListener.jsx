import { useCallback } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSSE } from '../hooks/useSSE'
import useChatStore from '../store/chatStore'

export default function VoiceListener() {
  const sessionId = useChatStore((s) => s.sessionId)
  const status = useChatStore((s) => s.status)
  const sttActive = useChatStore((s) => s.sttActive)
  const setSttActive = useChatStore((s) => s.setSttActive)
  const setStatus = useChatStore((s) => s.setStatus)
  const addMessage = useChatStore((s) => s.addMessage)

  const { sendMessage } = useSSE()

  const onFinalTranscript = useCallback(async (text) => {
    // Don't fire if already processing a response
    if (status === 'thinking' || status === 'speaking') return

    addMessage({ id: Date.now(), role: 'user', text, done: true })
    await sendMessage(sessionId, text)
    // Return to listening after response
    setStatus('listening')
  }, [status, addMessage, sendMessage, sessionId, setStatus])

  const { start, stop, isListening, interimText } = useSpeechRecognition({
    onFinalTranscript,
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