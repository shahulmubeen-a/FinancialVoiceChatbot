import sqlite3
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

DB_PATH = Path("/tmp/finance_assistant/chat_history.db")


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at TEXT,
                last_active TEXT,
                doc_name TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        conn.commit()
    logger.info("Database initialised.")


def save_session(session_id: str, title: Optional[str] = None, doc_name: Optional[str] = None) -> None:
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        conn.execute("""
            INSERT INTO sessions (id, title, created_at, last_active, doc_name)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                last_active = excluded.last_active,
                title = COALESCE(excluded.title, sessions.title),
                doc_name = COALESCE(excluded.doc_name, sessions.doc_name)
        """, (session_id, title, now, now, doc_name))
        conn.commit()


def touch_session(session_id: str) -> None:
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        conn.execute(
            "UPDATE sessions SET last_active = ? WHERE id = ?",
            (now, session_id)
        )
        conn.commit()


def update_session_title(session_id: str, title: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE sessions SET title = ? WHERE id = ?",
            (title, session_id)
        )
        conn.commit()


def update_session_doc(session_id: str, doc_name: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE sessions SET doc_name = ? WHERE id = ?",
            (doc_name, session_id)
        )
        conn.commit()


def save_message(session_id: str, role: str, text: str) -> None:
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, text, created_at) VALUES (?, ?, ?, ?)",
            (session_id, role, text, now)
        )
        conn.commit()
    touch_session(session_id)


def get_messages(session_id: str) -> list:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT role, text, created_at FROM messages WHERE session_id = ? ORDER BY id ASC",
            (session_id,)
        ).fetchall()
    return [dict(r) for r in rows]


def get_all_sessions() -> list:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, title, created_at, last_active, doc_name FROM sessions ORDER BY last_active DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def delete_session_from_db(session_id: str) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
    logger.info(f"Deleted session from DB: {session_id}")