import useChatStore from '../store/chatStore'

const STATUS_LABEL = {
  idle: '—',
  listening: '🎙 Listening...',
  thinking: '⏳ Thinking...',
  speaking: '🔊 Speaking...',
}

export default function StatusBar() {
  const status = useChatStore((s) => s.status)
  const docName = useChatStore((s) => s.docName)

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
      <span>{STATUS_LABEL[status]}</span>
      {docName && <span>📄 {docName}</span>}
    </div>
  )
}