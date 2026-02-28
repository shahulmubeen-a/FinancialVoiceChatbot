import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from models.schemas import UploadResponse
from services.session_manager import SessionManager
from services.document_parser import parse_document
from services.persistence import update_session_doc
from dependencies import get_session_manager
from utils.file_handler import save_upload, delete_file

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    manager: SessionManager = Depends(get_session_manager),
):
    session = manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    tmp_path = await save_upload(file, session_id)

    try:
        raw_text, parsed_data = parse_document(tmp_path)
    finally:
        delete_file(tmp_path)

    session.document_store.ingest(raw_text)
    session.parsed_data = parsed_data

    filename = file.filename or "uploaded_file"
    update_session_doc(session_id, filename)

    fields_found = sum(
        1 for f in [
            parsed_data.gross_income,
            parsed_data.net_pay,
            parsed_data.federal_tax,
            parsed_data.state_tax,
            parsed_data.social_security,
            parsed_data.medicare,
            parsed_data.health_insurance,
            parsed_data.retirement_401k,
        ]
        if f is not None
    )

    return UploadResponse(
        session_id=session_id,
        filename=filename,
        parsed_fields_found=fields_found,
        message=f"Document processed. Found {fields_found} financial field(s).",
    )

