export const BASE = import.meta.env.VITE_API_BASE || ''

export async function createSession() {
  const res = await fetch(`${BASE}/session/new`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function deleteSession(sessionId) {
  await fetch(`${BASE}/session/${sessionId}`, { method: 'DELETE' })
}

export async function getAllSessions() {
  const res = await fetch(`${BASE}/session/all`)
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json()
}

export async function getSessionMessages(sessionId) {
  const res = await fetch(`${BASE}/session/${sessionId}/messages`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
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

export async function streamChat(sessionId, message) {
  const res = await fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  })
  if (!res.ok) throw new Error('Chat request failed')
  return res
}

export async function fetchTTSAudio(text, signal) {
  const res = await fetch(`${BASE}/tts/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  })
  if (!res.ok) throw new Error('TTS failed')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}