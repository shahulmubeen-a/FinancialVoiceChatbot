import FileUpload from './FileUpload'
import useChatStore from '../store/chatStore'
import { useTTS } from '../hooks/useTTS'

export default function BottomBar({ voice }) {
  const interimText = useChatStore((s) => s.interimText)
  const isSpeaking = useChatStore((s) => s.isSpeaking)
  const { stop: stopTTS } = useTTS()

  return (
    <div style={{
      padding: '12px 32px 14px',
      background: 'var(--bg)',
      borderTop: '1px solid var(--border)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
    }}>

      {/* Live transcript */}
      {interimText && (
        <div style={{
          width: '100%',
          maxWidth: 520,
          background: '#F9FAFB',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '8px 14px',
          fontSize: 13,
          color: '#6B7280',
          fontStyle: 'italic',
          lineHeight: 1.5,
          textAlign: 'left',
        }}>
          {interimText}
        </div>
      )}

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}>

        {/* Attach */}
        <FileUpload />

        {/* Mic — hero */}
        <button
          onClick={voice.handleToggle}
          className={voice.sttActive ? 'mic-listening' : ''}
          style={{
            position: 'relative',
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: voice.sttActive ? 'var(--accent)' : '#111827',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: voice.sttActive ? 'var(--shadow-lg)' : 'var(--shadow-md)',
            transition: 'background 0.2s, transform 0.15s',
            zIndex: 1,
            border: 'none',
          }}
          onMouseEnter={e => { if (!voice.sttActive) e.currentTarget.style.transform = 'scale(1.05)' }}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title={voice.sttActive ? 'Stop listening' : 'Start listening'}
        >
          {voice.sttActive ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
        </button>

        {/* Stop TTS — mirror of attach for symmetry */}
        {isSpeaking ? (
          <button
            onClick={stopTTS}
            title="Stop speaking"
            style={{
              width: 40, height: 40,
              borderRadius: '50%',
              background: '#FEF2F2',
              color: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
              border: '1px solid #FECACA',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}

      </div>

      {/* Listening label */}
      {voice.sttActive && (
        <div style={{
          fontSize: 11,
          color: 'var(--accent)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          Listening...
        </div>
      )}

    </div>
  )
}