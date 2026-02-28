import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import useChatStore from '../store/chatStore'

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages)
  const interimText = useChatStore((s) => s.interimText)  // from store now
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, interimText])

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {messages.length === 0 && !interimText && (
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>
          Click "Start Listening" and ask a financial question.<br />
          Optionally upload a payslip for personalised guidance.
        </p>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {interimText && (
        <div style={{
          alignSelf: 'flex-end',
          maxWidth: '72%',
          padding: '8px 12px',
          background: '#e8f0fe',
          color: '#333',
          borderRadius: '12px 12px 2px 12px',
          fontStyle: 'italic',
          fontSize: 13,
        }}>
          {interimText}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}