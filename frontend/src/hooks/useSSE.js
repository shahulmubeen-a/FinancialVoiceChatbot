import { useCallback } from 'react'
import { streamChat } from '../services/api'
import useChatStore from '../store/chatStore'

export function useSSE() {
  const { appendToLast, markLastDone, addMessage, setStatus } = useChatStore()

  const sendMessage = useCallback(async (sessionId, message) => {
    setStatus('thinking')
    addMessage({ id: Date.now(), role: 'assistant', text: '', done: false })

    try {
      const res = await streamChat(sessionId, message)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      setStatus('speaking')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            markLastDone()
            setStatus('idle')
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.token) appendToLast(parsed.token)
            if (parsed.error) console.error('Stream error:', parsed.error)
          } catch { /* malformed line */ }
        }
      }
    } catch (err) {
      console.error('SSE error:', err)
    } finally {
      markLastDone()
      setStatus('idle')
    }
  }, [addMessage, appendToLast, markLastDone, setStatus])

  return { sendMessage }
}