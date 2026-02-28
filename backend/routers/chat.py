import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from langchain_groq import ChatGroq
from models.schemas import ChatRequest
from services.session_manager import SessionManager
from services.llm_chain import stream_response
from dependencies import get_session_manager, get_llm

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


async def _sse_generator(session, message: str, llm: ChatGroq):
    try:
        async for token in stream_response(session, message, llm):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        logger.error(f"Streaming error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    manager: SessionManager = Depends(get_session_manager),
    llm: ChatGroq = Depends(get_llm),
):
    # Try in-memory first, then restore from DB if it's a historical session
    session = manager.get_session(request.session_id)
    if not session:
        session = manager.restore_session(request.session_id)

    return StreamingResponse(
        _sse_generator(session, request.message, llm),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )