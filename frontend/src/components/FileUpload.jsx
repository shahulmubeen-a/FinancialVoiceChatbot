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
        id: Date.now(), role: 'system',
        text: `"${file.name}" uploaded — found ${result.parsed_fields_found} field(s).`,
        done: true,
      })
    } catch (err) {
      addMessage({ id: Date.now(), role: 'system', text: `Upload failed: ${err.message}`, done: true })
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.csv"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        title={docName ? `Replace: ${docName}` : 'Attach payslip (PDF or CSV)'}
        style={{
          width: 40, height: 40,
          borderRadius: '50%',
          background: docName ? '#F0FDF4' : '#F3F4F6',
          color: docName ? '#059669' : '#6B7280',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: docName ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = docName ? '#DCFCE7' : '#E5E7EB'}
        onMouseLeave={e => e.currentTarget.style.background = docName ? '#F0FDF4' : '#F3F4F6'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>
    </>
  )
}