import { useEffect } from 'react'
import { getAllSessions, createSession, deleteSession, getSessionMessages } from '../services/api'
import useChatStore from '../store/chatStore'

export default function SessionList() {
  const sessionList = useChatStore((s) => s.sessionList)
  const setSessionList = useChatStore((s) => s.setSessionList)
  const sessionId = useChatStore((s) => s.sessionId)
  const setSessionId = useChatStore((s) => s.setSessionId)
  const setMessages = useChatStore((s) => s.setMessages)
  const clearScreen = useChatStore((s) => s.clearScreen)

  const refresh = () => {
    getAllSessions().then(setSessionList).catch(console.error)
  }

  useEffect(() => {
    refresh()
  }, [sessionId])

  const handleLoad = async (id, docName) => {
    const raw = await getSessionMessages(id)
    const messages = raw.map((m, i) => ({
      id: i,
      role: m.role,
      text: m.text,
      done: true,
      fromHistory: true,
    }))
    setMessages(messages)
    setSessionId(id)
    useChatStore.getState().setDocName(docName || null)
    useChatStore.getState().setInterimText('')  // clear any lingering transcript
  }

  const handleNew = async () => {
    const data = await createSession()
    setSessionId(data.session_id)
    clearScreen()   // clears messages + interimText + docName in one go
    refresh()
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await deleteSession(id)
    if (id === sessionId) {
      const data = await createSession()
      setSessionId(data.session_id)
      clearScreen()  // clears everything on screen
    }
    refresh()
  }

  return (
    <div style={{
      width: 220,
      borderRight: '1px solid #ddd',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
    }}>
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <strong style={{ fontSize: 13 }}>Chats</strong>
        <button onClick={handleNew} title="New chat" style={{ padding: '3px 8px', fontSize: 12 }}>
          + New
        </button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {sessionList.length === 0 && (
          <p style={{ padding: 12, fontSize: 12, color: '#aaa' }}>No saved chats yet.</p>
        )}
        {sessionList.map((s) => (
          <div
            key={s.id}
            onClick={() => handleLoad(s.id, s.doc_name)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              background: s.id === sessionId ? '#e8f0fe' : 'transparent',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 6,
            }}
          >
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {s.title || 'Chat'}
              </div>
              {s.doc_name && (
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  📄 {s.doc_name}
                </div>
              )}
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                {new Date(s.last_active).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(e, s.id)}
              title="Delete"
              style={{
                padding: '1px 6px',
                fontSize: 11,
                border: '1px solid #ddd',
                background: 'transparent',
                color: '#999',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}