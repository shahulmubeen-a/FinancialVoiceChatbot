import useChatStore from '../store/chatStore'

const STATUS_LABEL = {
  idle: '',
  listening: '',
  thinking: '⏳ Thinking...',
  speaking: '🔊 Speaking...',
}

export default function StatusBar() {
  const status = useChatStore((s) => s.status)
  const docName = useChatStore((s) => s.docName)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontSize: 12,
      color: '#9CA3AF',
    }}>
      {STATUS_LABEL[status] && (
        <span style={{ color: status === 'thinking' ? '#F59E0B' : '#10B981' }}>
          {STATUS_LABEL[status]}
        </span>
      )}
      {docName && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: '#F0FDF4',
          color: '#059669',
          border: '1px solid #A7F3D0',
          borderRadius: 20,
          padding: '2px 10px',
          fontSize: 11,
          fontWeight: 500,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          {docName.length > 20 ? docName.slice(0, 20) + '...' : docName}
        </span>
      )}
    </div>
  )
}