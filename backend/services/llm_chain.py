import logging
from pathlib import Path
from typing import AsyncGenerator
from pydantic import SecretStr
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from services.session_manager import Session
from services.persistence import save_message, update_session_title
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT_TEMPLATE = (
    Path(__file__).parent.parent / "prompts" / "finance_system.txt"
).read_text()


def build_llm() -> ChatGroq:
    return ChatGroq(
        api_key=SecretStr(settings.groq_api_key),
        model="llama-3.1-8b-instant",
        temperature=0.4,
        max_tokens=512,
        streaming=True,
    )


def _build_system_prompt(session: Session, query: str) -> str:
    if session.has_document:
        doc_context = session.document_store.get_context(query)
        financial_block = (
            session.parsed_data.to_prompt_block() if session.parsed_data else ""
        )
    else:
        doc_context = "No document uploaded yet."
        financial_block = ""

    # Use explicit replace instead of .format() — financial docs often contain
    # curly braces which break str.format() with a KeyError
    prompt = SYSTEM_PROMPT_TEMPLATE.replace("{document_context}", doc_context)
    prompt = prompt.replace("{financial_data_block}", financial_block)
    return prompt


async def stream_response(
    session: Session,
    user_message: str,
    llm: ChatGroq,
) -> AsyncGenerator[str, None]:
    system_prompt = _build_system_prompt(session, user_message)
    trimmed_history = session.chat_history[-(session.max_history_turns * 2):]

    messages = (
        [SystemMessage(content=system_prompt)]
        + trimmed_history
        + [HumanMessage(content=user_message)]
    )

    full_response = ""

    async for chunk in llm.astream(messages):
        raw = chunk.content
        token = raw if isinstance(raw, str) else ""
        if token:
            full_response += token
            yield token

    save_message(session.session_id, "user", user_message)
    save_message(session.session_id, "assistant", full_response)

    if len(session.chat_history) == 0:
        title = user_message[:60] + ("..." if len(user_message) > 60 else "")
        update_session_title(session.session_id, title)

    session.chat_history.append(HumanMessage(content=user_message))
    session.chat_history.append(AIMessage(content=full_response))