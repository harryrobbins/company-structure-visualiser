# api/router.py

import logging
from fastapi import APIRouter, HTTPException
# Use relative imports to find other files in the same 'api' directory.
from . import llm_interface
from .models import ImageExtractionRequest, TextExtractionResponse

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- API Router Initialization ---
router = APIRouter(prefix="/api")

# --- API Endpoint Definition ---
# api/router.py (top)
import logging
logger = logging.getLogger(__name__)

@router.post("/extract_text", response_model=TextExtractionResponse)
async def extract_text_from_image(request: ImageExtractionRequest):
    logger.info("extract_text called", extra={"page": request.page_number})
    try:
        extracted_text = await llm_interface.extract_text_from_image(request.image_data)
        if extracted_text is None:
            logger.warning("no text returned", extra={"page": request.page_number})
            extracted_text = "[No text found on this page]"
        return TextExtractionResponse(page_number=request.page_number, text=extracted_text)
    except Exception as e:
        logger.exception("extract_text failed", extra={"page": request.page_number})
        raise HTTPException(status_code=500, detail="An error occurred while processing the page.")
