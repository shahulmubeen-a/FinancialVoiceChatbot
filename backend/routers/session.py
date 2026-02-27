import logging
from fastapi import APIRouter, Depends, HTTPException
from models.schemas import NewSessionResponse
from services.session_manager import SessionManager
from dependencies import get_session_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/session", tags=["session"])


@router.post("/new", response_model=NewSessionResponse)
def create_session(manager: SessionManager = Depends(get_session_manager)):
    session_id = manager.create_session()
    return NewSessionResponse(session_id=session_id)


@router.delete("/{session_id}")
def delete_session(
    session_id: str,
    manager: SessionManager = Depends(get_session_manager),
):
    session = manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    manager.delete_session(session_id)
    return {"message": "Session deleted."}