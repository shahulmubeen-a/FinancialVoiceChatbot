import { useEffect } from 'react'
import { getAllSessions, createSession, deleteSession, getSessionMessages } from '../services/api'
import useChatStore from '../store/chatStore'

export default function SessionList({ onToggleSidebar }) {
  const sessionList = useChatStore((s) => s.sessionList)
  const setSessionList = useChatStore((s) => s.setSessionList)
  const sessionId = useChatStore((s) => s.sessionId)
  const setSessionId = useChatStore((s) => s.setSessionId)
  const setMessages = useChatStore((s) => s.setMessages)
  const clearScreen = useChatStore((s) => s.clearScreen)
  const setDocName = useChatStore((s) => s.setDocName)
  const setInterimText = useChatStore((s) => s.setInterimText)

  const refresh = () => getAllSessions().then(setSessionList).catch(console.error)

  useEffect(() => { refresh() }, [sessionId])

  const handleLoad = async (id, docName) => {
    const raw = await getSessionMessages(id)
    const messages = raw.map((m, i) => ({
      id: i, role: m.role, text: m.text, done: true, fromHistory: true,
    }))
    setMessages(messages)
    setSessionId(id)
    setDocName(docName || null)
    setInterimText('')
  }

  const handleNew = async () => {
    const data = await createSession()
    setSessionId(data.session_id)
    clearScreen()
    refresh()
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await deleteSession(id)
    if (id === sessionId) {
      const data = await createSession()
      setSessionId(data.session_id)
      clearScreen()
    }
    refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: 240 }}>

      {/* Sidebar header — hamburger lives here now */}
      <div style={{
        height: 56,
        padding: '0 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #1F2937',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Hamburger — collapses sidebar */}
          <button
            onClick={onToggleSidebar}
            title="Close sidebar"
            style={{
              width: 30, height: 30, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6B7280', transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <span style={{ color: '#F9FAFB', fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em' }}>
            Chats
          </span>
        </div>

        {/* New chat button */}
        <button
          onClick={handleNew}
          title="New chat"
          style={{
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9CA3AF', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {sessionList.length === 0 && (
          <p style={{ padding: '16px', fontSize: 12, color: '#4B5563', textAlign: 'center', lineHeight: 1.6 }}>
            No chats yet.<br />Start talking to begin.
          </p>
        )}

        {sessionList.map((s) => {
          const isActive = s.id === sessionId
          return (
            <div
              key={s.id}
              onClick={() => handleLoad(s.id, s.doc_name)}
              style={{
                padding: '9px 14px',
                cursor: 'pointer',
                background: isActive ? '#1F2937' : 'transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                transition: 'background 0.15s',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#1A2535' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{
                  fontSize: 12, fontWeight: 500,
                  color: isActive ? '#F9FAFB' : '#D1D5DB',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {s.title || 'New chat'}
                </div>
                <div style={{ fontSize: 10, color: '#4B5563', marginTop: 2 }}>
                  {new Date(s.last_active).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {s.doc_name && <span style={{ color: '#059669', marginLeft: 6 }}>📄</span>}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, s.id)}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#4B5563', opacity: 0, transition: 'opacity 0.15s, color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}
                ref={(el) => {
                  if (el) {
                    el.parentElement.addEventListener('mouseenter', () => el.style.opacity = '1')
                    el.parentElement.addEventListener('mouseleave', () => el.style.opacity = '0')
                  }
                }}
                title="Delete"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}