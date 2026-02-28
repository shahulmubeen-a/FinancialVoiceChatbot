import { create } from 'zustand'

const useChatStore = create((set) => ({
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  messages: [],
  setMessages: (messages) => set({ messages }),
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

  status: 'idle',
  setStatus: (status) => set({ status }),

  isSpeaking: false,
  setIsSpeaking: (val) => set({ isSpeaking: val }),

  docName: null,
  setDocName: (name) => set({ docName: name }),

  sttActive: false,
  setSttActive: (val) => set({ sttActive: val }),

  sessionList: [],
  setSessionList: (list) => set({ sessionList: list }),
}))

export default useChatStore