from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache

class Settings(BaseSettings):
    groq_api_key: str = Field(default="", validation_alias="GROQ_API_KEY")
    elevenlabs_api_key: str = Field(default="", validation_alias="ELEVENLABS_API_KEY")
    allowed_origin: str = "http://localhost:5173"
    session_ttl_minutes: int = 30
    max_file_size_mb: int = 10
    environment: str = "development"
    max_file_size_bytes: int = 0

    def model_post_init(self, __context):
        self.max_file_size_bytes = self.max_file_size_mb * 1024 * 1024
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY is not set in .env")

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()