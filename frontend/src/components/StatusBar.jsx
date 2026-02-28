import useChatStore from '../store/chatStore'
import { useTTS } from '../hooks/useTTS'

const STATUS_LABEL = {
  idle: '—',
  listening: '🎙 Listening...',
  thinking: '⏳ Thinking...',
  speaking: '🔊 Speaking...',
}

export default function StatusBar() {
  const status = useChatStore((s) => s.status)
  const docName = useChatStore((s) => s.docName)
  const isSpeaking = useChatStore((s) => s.isSpeaking)
  const { stop } = useTTS()

  return (
    <div style={{
      padding: '6px 12px',
      borderBottom: '1px solid #ddd',
      background: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 12,
      color: '#555',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{STATUS_LABEL[status]}</span>
        {isSpeaking && (
          <button
            onClick={stop}
            style={{
              padding: '2px 8px',
              fontSize: 11,
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            ⏹ Stop
          </button>
        )}
      </div>
      {docName && <span>📄 {docName}</span>}
    </div>
  )
}