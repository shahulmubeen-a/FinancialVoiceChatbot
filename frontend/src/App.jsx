import { useEffect } from 'react'
import { createSession } from './services/api'
import useChatStore from './store/chatStore'
import ChatWindow from './components/ChatWindow'
import FileUpload from './components/FileUpload'
import StatusBar from './components/StatusBar'
import VoiceListener from './components/VoiceListener'

export default function App() {
  const setSessionId = useChatStore((s) => s.setSessionId)
  const sessionId = useChatStore((s) => s.sessionId)

  useEffect(() => {
    createSession()
      .then((data) => setSessionId(data.session_id))
      .catch((err) => console.error('Session init failed:', err))
  }, [setSessionId])

  // VoiceListener is a logic component — we use it as a hook-provider here
  // by rendering it and pulling out what we need via its return value
  const voice = VoiceListener()

  if (!sessionId) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Starting session...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Top bar */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid #ddd',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <strong>💰 Finance Assistant</strong>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <FileUpload />
          <button
            onClick={voice.handleToggle}
            className={voice.sttActive ? 'active' : ''}
          >
            {voice.sttActive ? '⏹ Stop Listening' : '🎙 Start Listening'}
          </button>
        </div>
      </div>

      <StatusBar />

      <ChatWindow interimText={voice.interimText} />

    </div>
  )
}