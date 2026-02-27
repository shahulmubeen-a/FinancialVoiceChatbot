import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  // Session
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  // Messages: { id, role: 'user'|'assistant', text, done }
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  appendToLast: (token) => set((s) => {
    const msgs = [...s.messages]
    if (msgs.length === 0) return s
    const last = { ...msgs[msgs.length - 1] }
    last.text += token
    msgs[msgs.length - 1] = last
    return { messages: msgs }
  }),
  markLastDone: () => set((s) => {
    const msgs = [...s.messages]
    if (msgs.length === 0) return s
    msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], done: true }
    return { messages: msgs }
  }),

  // Status: 'idle' | 'listening' | 'thinking' | 'speaking'
  status: 'idle',
  setStatus: (status) => set({ status }),

  // Document
  docName: null,
  setDocName: (name) => set({ docName: name }),

  // Whether STT is active (user clicked Start once)
  sttActive: false,
  setSttActive: (val) => set({ sttActive: val }),
}))

export default useChatStore