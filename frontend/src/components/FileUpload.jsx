import { useRef } from 'react'
import { uploadDocument } from '../services/api'
import useChatStore from '../store/chatStore'

const MAX_MB = 10
const ALLOWED = ['application/pdf', 'text/csv', 'application/vnd.ms-excel']

export default function FileUpload() {
  const inputRef = useRef(null)
  const sessionId = useChatStore((s) => s.sessionId)
  const setDocName = useChatStore((s) => s.setDocName)
  const addMessage = useChatStore((s) => s.addMessage)
  const docName = useChatStore((s) => s.docName)

  const handleFile = async (file) => {
    if (!file) return

    if (!ALLOWED.includes(file.type)) {
      alert('Only PDF or CSV files are supported.')
      return
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File must be under ${MAX_MB}MB.`)
      return
    }

    try {
      const result = await uploadDocument(sessionId, file)
      setDocName(file.name)
      addMessage({
        id: Date.now(),
        role: 'system',
        text: `✅ "${file.name}" uploaded. Found ${result.parsed_fields_found} financial field(s).`,
        done: true,
      })
    } catch (err) {
      addMessage({
        id: Date.now(),
        role: 'system',
        text: `❌ Upload failed: ${err.message}`,
        done: true,
      })
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.csv"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        title="Upload payslip (PDF or CSV)"
      >
        📎 {docName ? 'Replace Doc' : 'Upload Doc'}
      </button>
    </div>
  )
}