import asyncio
import logging
from typing import Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routers import session, upload, chat
from dependencies import get_session_manager
from config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()
limiter = Limiter(key_func=get_remote_address)


def _rate_limit_handler(request: Request, exc: Any) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please slow down."},
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager = get_session_manager()
    task = asyncio.create_task(manager.run_expiry_loop())
    logger.info("Finance Voice Assistant started.")
    yield
    task.cancel()
    logger.info("Finance Voice Assistant shutting down.")


app = FastAPI(
    title="Finance Voice Assistant",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)  # type: ignore[arg-type]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.allowed_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(upload.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.environment}