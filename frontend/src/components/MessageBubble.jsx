import { useEffect, useRef } from 'react'
import { useTTS } from '../hooks/useTTS'

// Strips markdown tables from text before sending to TTS
function stripTablesForTTS(text) {
  return text
    .replace(/\|.*\|.*\n(\|[-| :]+\|.*\n)((\|.*\|.*\n)*)/g, ' See the table above for details. ')
    .replace(/\|.*\|/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Renders a markdown table as an HTML table
function renderTable(tableText) {
  const lines = tableText.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return null

  const parseRow = (line) =>
    line.split('|').map((c) => c.trim()).filter(Boolean)

  const headers = parseRow(lines[0])
  const rows = lines.slice(2).map(parseRow)  // skip separator line

  return (
    <table style={{
      borderCollapse: 'collapse',
      width: '100%',
      fontSize: 12,
      margin: '6px 0',
    }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={{
              border: '1px solid #ccc',
              padding: '4px 8px',
              background: '#f0f0f0',
              textAlign: 'left',
              fontWeight: 600,
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} style={{
                border: '1px solid #ccc',
                padding: '4px 8px',
              }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Splits message text into segments: plain text and markdown tables
function renderMessageContent(text) {
  const tableRegex = /(\|.+\|.*\n(?:\|[-| :]+\|.*\n)(?:\|.+\|.*\n?)*)/g
  const segments = []
  let lastIndex = 0
  let match

  while ((match = tableRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'table', content: match[0] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

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
      !message.fromHistory &&   // Bug 1 fix: skip TTS for loaded history messages
      message.text.trim()
    ) {
      hasSpoken.current = true
      // Feature 4: strip tables before speaking
      const ttsText = stripTablesForTTS(message.text)
      speak(ttsText)
    }
  }, [message.done, message.role, message.text, message.fromHistory, speak])

  const styles = {
    user: {
      alignSelf: 'flex-end',
      background: '#1a73e8',
      color: '#fff',
      borderRadius: '12px 12px 2px 12px',
    },
    assistant: {
      alignSelf: 'flex-start',
      background: '#fff',
      color: '#111',
      border: '1px solid #ddd',
      borderRadius: '12px 12px 12px 2px',
    },
    system: {
      alignSelf: 'center',
      background: '#f0f4ff',
      color: '#555',
      borderRadius: 8,
      fontSize: 12,
    },
  }

  const segments = renderMessageContent(message.text)

  return (
    <div style={{
      maxWidth: '72%',
      padding: '8px 12px',
      wordBreak: 'break-word',
      lineHeight: 1.5,
      ...styles[message.role],
    }}>
      {segments.map((seg, i) =>
        seg.type === 'table'
          ? <div key={i}>{renderTable(seg.content)}</div>
          : <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{seg.content}</span>
      )}
      {message.role === 'assistant' && !message.done && (
        <span style={{ opacity: 0.5 }}>▌</span>
      )}
    </div>
  )
}