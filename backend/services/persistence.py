import psycopg2
import psycopg2.extras
import logging
from datetime import datetime
from typing import Optional
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_conn():
    # Only require SSL if we are connecting to a remote Supabase DB
    ssl_mode = "require" if "supabase.co" in settings.database_url else "prefer"
    conn = psycopg2.connect(
        settings.database_url,
        cursor_factory=psycopg2.extras.RealDictCursor,
        sslmode=ssl_mode,
    )
    return conn


def init_db() -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    created_at TEXT,
                    last_active TEXT,
                    doc_name TEXT
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    text TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES sessions(id)
                )
            """)
        conn.commit()
    logger.info("Database initialised.")


def touch_session(session_id: str) -> None:
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE sessions SET last_active = %s WHERE id = %s",
                (now, session_id)
            )
        conn.commit()


def update_session_title(session_id: str, title: str) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE sessions SET title = %s WHERE id = %s",
                (title, session_id)
            )
        conn.commit()


def update_session_doc(session_id: str, doc_name: str) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE sessions SET doc_name = %s WHERE id = %s",
                (doc_name, session_id)
            )
        conn.commit()


def save_message(session_id: str, role: str, text: str) -> None:
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO sessions (id, title, created_at, last_active, doc_name)
                VALUES (%s, NULL, %s, %s, NULL)
                ON CONFLICT (id) DO UPDATE SET last_active = EXCLUDED.last_active
            """, (session_id, now, now))
            cur.execute(
                "INSERT INTO messages (session_id, role, text, created_at) VALUES (%s, %s, %s, %s)",
                (session_id, role, text, now)
            )
        conn.commit()
    touch_session(session_id)


def get_messages(session_id: str) -> list:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT role, text, created_at FROM messages WHERE session_id = %s ORDER BY id ASC",
                (session_id,)
            )
            rows = cur.fetchall()
    return [dict(r) for r in rows]


def get_all_sessions() -> list:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT s.id, s.title, s.created_at, s.last_active, s.doc_name
                FROM sessions s
                WHERE EXISTS (
                    SELECT 1 FROM messages m WHERE m.session_id = s.id
                )
                ORDER BY s.last_active DESC
            """)
            rows = cur.fetchall()
    return [dict(r) for r in rows]


def delete_session_from_db(session_id: str) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM messages WHERE session_id = %s", (session_id,))
            cur.execute("DELETE FROM sessions WHERE id = %s", (session_id,))
        conn.commit()
    logger.info(f"Deleted session from DB: {session_id}")
