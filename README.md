# Finance Voice Assistant

A voice-enabled AI chatbot that provides personalized financial guidance. Upload payslips or financial documents (PDF/CSV) and get context-aware advice powered by LLMs.

## Features

- **Voice Interaction**: Talk to your finance assistant using speech-to-text and text-to-speech
- **Document Analysis**: Automatically extracts financial data from payslips (income, taxes, deductions, etc.)
- **Currency-Aware**: Supports multiple currencies ($, £, €, ₹, ¥)
- **RAG Pipeline**: Semantic search for large documents, full context for small ones
- **Session Management**: Persistent chat history with auto-expiry
- **Streaming Responses**: Real-time LLM responses via SSE

## Tech Stack

### Backend
- FastAPI, Python 3.13
- LangChain, Groq (Llama 3.1-8B)
- FAISS, HuggingFace embeddings (all-MiniLM-L6-v2)
- SQLite for persistence

### Frontend
- React 18, Vite
- Zustand for state management
- Web Speech API for voice

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
```

Create `.env` file:
```
GROQ_API_KEY=your_groq_key
ELEVENLABS_API_KEY=your_elevenlabs_key
DATABASE_URL=./finance_assistant.db
ALLOWED_ORIGIN=http://localhost:5173
```

Run:
```bash
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `POST /session/new` - Create new session
- `GET /session/all` - List all sessions
- `DELETE /session/{id}` - Delete session
- `POST /upload/` - Upload document
- `POST /chat/stream` - Stream chat response (SSE)
- `POST /tts/speak` - Text-to-speech (client-side)

## Document Support

- PDF payslips
- CSV financial statements
- Max file size: 10MB

## License

MIT
