import { useEffect, useRef } from 'react'
import { useTTS } from '../hooks/useTTS'

function stripTablesForTTS(text) {
  return text
    .replace(
      /\|.*\|.*\n(\|[-| :]+\|.*\n)((\|.*\|.*\n)*)/g,
      ' I put together a table for the full breakdown. '
    )
    .replace(/\|.*\|/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderTable(tableText) {
  const lines = tableText.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return null
  const parseRow = (line) => line.split('|').map((c) => c.trim()).filter(Boolean)
  const headers = parseRow(lines[0])
  const rows = lines.slice(2).map(parseRow)

  return (
    <div style={{ overflowX: 'auto', margin: '8px 0' }}>
      <table style={{
        borderCollapse: 'collapse', width: '100%',
        fontSize: 12, borderRadius: 8, overflow: 'hidden',
      }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '8px 12px', textAlign: 'left',
                background: '#F3F4F6', fontWeight: 600,
                color: '#374151', fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                borderBottom: '1px solid #E5E7EB',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#F9FAFB' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '7px 12px',
                  borderBottom: '1px solid #F3F4F6',
                  color: '#374151',
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderMessageContent(text) {
  const tableRegex = /(\|.+\|.*\n(?:\|[-| :]+\|.*\n)(?:\|.+\|.*\n?)*)/g
  const segments = []
  let lastIndex = 0
  let match
  while ((match = tableRegex.exec(text)) !== null) {
    if (match.index > lastIndex)
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    segments.push({ type: 'table', content: match[0] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length)
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  return segments.length > 0 ? segments : [{ type: 'text', content: text }]
}

export default function MessageBubble({ message }) {
  const { speak } = useTTS()
  const hasSpoken = useRef(false)

  useEffect(() => {
    if (
      message.role === 'assistant' &&
      message.done &&
      !hasSpoken.current &&
      !message.fromHistory &&
      message.text.trim()
    ) {
      hasSpoken.current = true
      speak(stripTablesForTTS(message.text))
    }
  }, [message.done, message.role, message.text, message.fromHistory, speak])

  if (message.role === 'system') {
    return (
      <div className="message-enter" style={{
        alignSelf: 'center',
        background: '#F0FDF4',
        color: '#059669',
        border: '1px solid #A7F3D0',
        borderRadius: 20,
        padding: '4px 14px',
        fontSize: 12,
        fontWeight: 500,
      }}>
        {message.text}
      </div>
    )
  }

  const isUser = message.role === 'user'

  return (
    <div
      className="message-enter"
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div style={{
        maxWidth: '68%',
        padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? 'var(--user-bubble)' : 'var(--ai-bubble)',
        color: isUser ? 'var(--user-text)' : 'var(--ai-text)',
        boxShadow: isUser ? 'none' : 'var(--shadow-sm)',
        border: isUser ? 'none' : '1px solid var(--border)',
        wordBreak: 'break-word',
        lineHeight: 1.6,
        fontSize: 13.5,
      }}>
        {renderMessageContent(message.text).map((seg, i) =>
          seg.type === 'table'
            ? <div key={i}>{renderTable(seg.content)}</div>
            : <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{seg.content}</span>
        )}
        {message.role === 'assistant' && !message.done && (
          <span className="cursor-blink" style={{ opacity: 0.4, marginLeft: 1 }}>▌</span>
        )}
      </div>
    </div>
  )
}