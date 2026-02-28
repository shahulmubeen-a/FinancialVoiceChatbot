import { useEffect, useState } from 'react'
import { createSession } from './services/api'
import useChatStore from './store/chatStore'
import ChatWindow from './components/ChatWindow'
import StatusBar from './components/StatusBar'
import VoiceListener from './components/VoiceListener'
import SessionList from './components/SessionList'
import BottomBar from './components/BottomBar'

export default function App() {
  const setSessionId = useChatStore((s) => s.setSessionId)
  const sessionId = useChatStore((s) => s.sessionId)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    createSession()
      .then((data) => setSessionId(data.session_id))
      .catch((err) => console.error('Session init failed:', err))
  }, [setSessionId])

  const voice = VoiceListener()

  if (!sessionId) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: 'var(--bg)',
        fontFamily: 'var(--font)', color: 'var(--muted)', fontSize: 13,
      }}>
        Starting session...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 240 : 0,
        minWidth: sidebarOpen ? 240 : 0,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <SessionList onToggleSidebar={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: 'var(--bg)',
      }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 56,
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hamburger only shows here when sidebar is collapsed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6B7280', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}
            <span style={{ fontWeight: 600, fontSize: 15, color: '#111827', letterSpacing: '-0.01em' }}>
              Finance Assistant
            </span>
          </div>
          <StatusBar />
        </div>

        <ChatWindow />
        <BottomBar voice={voice} />

        <div style={{
          padding: '4px 24px 8px', fontSize: 11,
          color: '#D1D5DB', textAlign: 'center', background: 'var(--bg)',
        }}>
          General financial guidance only — not regulated financial advice.
        </div>

      </div>
    </div>
  )
}