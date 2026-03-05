from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/tts", tags=["tts"])

@router.post("/speak")
async def speak():
    return JSONResponse(status_code=501, content={"detail": "TTS handled client-side."})
