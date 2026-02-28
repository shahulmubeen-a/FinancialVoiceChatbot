import uuid
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from services.rag_pipeline import DocumentStore
from services.persistence import delete_session_from_db, touch_session
from models.financial import ParsedFinancialData
from config import get_settings
from utils.file_handler import cleanup_session_dir

logger = logging.getLogger(__name__)
settings = get_settings()

class Session:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = datetime.utcnow()
        self.last_active = datetime.utcnow()
        self.document_store = DocumentStore()
        self.parsed_data: Optional[ParsedFinancialData] = None
        self.chat_history: list = []
        self.max_history_turns: int = 10

    def touch(self):
        self.last_active = datetime.utcnow()

    @property
    def has_document(self) -> bool:
        return self.document_store.raw_text is not None

    def is_expired(self, ttl_minutes: int) -> bool:
        return datetime.now() - self.last_active > timedelta(minutes=ttl_minutes)


class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, Session] = {}

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = Session(session_id)
        logger.info(f"Session created in memory: {session_id}")
        return session_id

    def get_session(self, session_id: str) -> Optional[Session]:
        session = self._sessions.get(session_id)
        if session:
            session.touch()
        return session

    def restore_session(self, session_id: str) -> Session:
        """
        Called when loading a historical session from the sidebar.
        Creates an in-memory Session object without reinitialising DB.
        """
        if session_id not in self._sessions:
            self._sessions[session_id] = Session(session_id)
            logger.info(f"Restored session into memory: {session_id}")
        return self._sessions[session_id]

    def delete_session(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
        delete_session_from_db(session_id)
        cleanup_session_dir(session_id)
        logger.info(f"Session deleted: {session_id}")

    async def run_expiry_loop(self) -> None:
        while True:
            await asyncio.sleep(300)
            expired = [
                sid for sid, s in self._sessions.items()
                if s.is_expired(settings.session_ttl_minutes)
            ]
            for sid in expired:
                self._sessions.pop(sid, None)
                cleanup_session_dir(sid)
            if expired:
                logger.info(f"Expired {len(expired)} session(s) from memory.")