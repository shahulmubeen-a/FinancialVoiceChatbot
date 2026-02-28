import uuid
import logging
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "text/csv": ".csv",
    "application/vnd.ms-excel": ".csv",
}

TMP_BASE = Path("/tmp/finance_assistant")

async def save_upload(file: UploadFile, session_id: str) -> Path:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Only PDF and CSV allowed.",
        )

    contents = await file.read()

    if len(contents) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.max_file_size_mb}MB limit.",
        )

    session_dir = TMP_BASE / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    ext = ALLOWED_TYPES[file.content_type]
    save_path = session_dir / f"upload_{uuid.uuid4().hex[:8]}{ext}"

    async with aiofiles.open(save_path, "wb") as f:
        await f.write(contents)

    logger.info(f"File saved for session {session_id}: {save_path.name}")
    return save_path

def delete_file(path: Path) -> None:
    try:
        if path.exists():
            path.unlink()
            logger.info(f"Deleted tmp file: {path.name}")
    except Exception as e:
        logger.warning(f"Could not delete tmp file {path.name}: {e}")

def cleanup_session_dir(session_id: str) -> None:
    session_dir = TMP_BASE / session_id
    try:
        if session_dir.exists():
            for f in session_dir.iterdir():
                f.unlink()
            session_dir.rmdir()
            logger.info(f"Cleaned up session dir: {session_id}")
    except Exception as e:
        logger.warning(f"Session dir cleanup failed for {session_id}: {e}")