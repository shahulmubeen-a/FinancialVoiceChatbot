from pydantic import BaseModel, Field
from typing import Optional

class NewSessionResponse(BaseModel):
    session_id: str

class UploadResponse(BaseModel):
    session_id: str
    filename: str
    parsed_fields_found: int
    message: str

class ChatRequest(BaseModel):
    session_id: str
    message: str = Field(..., min_length=1, max_length=2000)

class ErrorResponse(BaseModel):
    detail: str