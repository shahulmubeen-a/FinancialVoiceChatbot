import { useEffect, useRef } from 'react'
import { useTTS } from '../hooks/useTTS'

export default function MessageBubble({ message }) {
  const { speak } = useTTS()
  const hasSpoken = useRef(false)

  // Auto-speak assistant messages when they finish streaming
  useEffect(() => {
    if (
      message.role === 'assistant' &&
      message.done &&
      !hasSpoken.current &&
      message.text.trim()
    ) {
      hasSpoken.current = true
      speak(message.text)
    }
  }, [message.done, message.role, message.text, speak])

  const styles = {
    user: {
      alignSelf: 'flex-end',
      background: '#1a73e8',
      color: '#fff',
      borderRadius: '12px 12px 2px 12px',
    },
    assistant: {
      alignSelf: 'flex-start',
      background: '#fff',
      color: '#111',
      border: '1px solid #ddd',
      borderRadius: '12px 12px 12px 2px',
    },
    system: {
      alignSelf: 'center',
      background: '#f0f4ff',
      color: '#555',
      borderRadius: 8,
      fontSize: 12,
    },
  }

  return (
    <div style={{
      maxWidth: '72%',
      padding: '8px 12px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      lineHeight: 1.5,
      ...styles[message.role],
    }}>
      {message.text}
      {message.role === 'assistant' && !message.done && (
        <span style={{ opacity: 0.5 }}>▌</span>
      )}
    </div>
  )
}