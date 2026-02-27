const BASE = ''  // proxied via vite to localhost:8000

export async function createSession() {
  const res = await fetch(`${BASE}/session/new`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()  // { session_id }
}

export async function deleteSession(sessionId) {
  await fetch(`${BASE}/session/${sessionId}`, { method: 'DELETE' })
}

export async function uploadDocument(sessionId, file) {
  const form = new FormData()
  form.append('session_id', sessionId)
  form.append('file', file)
  const res = await fetch(`${BASE}/upload/`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

// Returns a raw fetch Response for SSE streaming — caller handles the stream
export async function streamChat(sessionId, message) {
  const res = await fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  })
  if (!res.ok) throw new Error('Chat request failed')
  return res
}

export async function fetchTTSAudio(text) {
  const res = await fetch('/tts/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('TTS failed')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}