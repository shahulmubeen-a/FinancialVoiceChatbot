import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from elevenlabs import ElevenLabs
from config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tts", tags=["tts"])
settings = get_settings()


class TTSRequest(BaseModel):
    text: str


@router.post("/speak")
async def speak(request: TTSRequest):
    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=501, detail="ElevenLabs not configured.")

    if len(request.text) > 2000:
        raise HTTPException(status_code=400, detail="Text too long for TTS.")

    try:
        client = ElevenLabs(api_key=settings.elevenlabs_api_key)

        audio = client.text_to_speech.convert(
            voice_id="JBFqnCBsd6RMkjVDRZzb",  # "George" — warm, natural US male
            text=request.text,
            model_id="eleven_turbo_v2_5",      # fastest + cheapest model
            output_format="mp3_44100_128",
        )

        def audio_stream():
            for chunk in audio:
                yield chunk

        return StreamingResponse(
            audio_stream(),
            media_type="audio/mpeg",
        )

    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail="TTS generation failed.")