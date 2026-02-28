from functools import lru_cache
from langchain_groq import ChatGroq
from services.llm_chain import build_llm
from services.session_manager import SessionManager

@lru_cache()
def get_llm() -> ChatGroq:
    return build_llm()

@lru_cache()
def get_session_manager() -> SessionManager:
    return SessionManager()