# api/router.py (Updated)
# Implements dependency injection, robust error handling, and clean logging.

import logging
from fastapi import APIRouter, Depends, HTTPException
from openai import APIConnectionError, RateLimitError, APIStatusError

from . import llm_interface
from .models import ImageExtractionRequest, TextExtractionResponse
from .llm_client import LLMClientDep, get_llm_client
from .errors import AppError

# Get a logger instance. The duplicate basicConfig and logger definitions are removed.
logger = logging.getLogger(__name__)

# --- API Router Initialization ---
router = APIRouter(prefix="/api")


@router.post("/extract_text", response_model=TextExtractionResponse, tags=["Extraction"])
async def extract_text_from_image(
        request: ImageExtractionRequest,
        llm_client=LLMClientDep  # Use dependency injection to get the client
):
    """
    Receives a page number and a base64-encoded image, and returns the extracted text.
    - Validates the request body using the `ImageExtractionRequest` model.
    - Uses a dependency-injected LLM client.
    - Handles specific LLM errors and maps them to typed `AppError` responses.
    """
    logger.info("Received request to extract text from page.", extra={"page": request.page_number})

    try:
        extracted_text = await llm_interface.extract_text_from_image(
            client=llm_client,
            image_data=request.image_data
        )

        if extracted_text is None:
            logger.warning("LLM returned no text for page.", extra={"page": request.page_number})
            extracted_text = "[No text found on this page]"

        return TextExtractionResponse(page_number=request.page_number, text=extracted_text)

    # Handle specific, known errors from the OpenAI client library.
    except APIConnectionError as e:
        logger.error(f"LLM connection error: {e.__cause__}", extra={"page": request.page_number})
        raise AppError(status_code=504, code="llm_connection_failed", message="Could not connect to the AI service.")

    except RateLimitError:
        logger.warning("LLM rate limit exceeded.", extra={"page": request.page_number})
        raise AppError(status_code=429, code="llm_rate_limited", message="AI service is busy. Please try again later.")

    except APIStatusError as e:
        logger.error(f"LLM API error. Status: {e.status_code}, Response: {e.response}",
                     extra={"page": request.page_number})
        raise AppError(status_code=502, code="llm_api_error",
                       message=f"The AI service returned an error (status: {e.status_code}).")

    # Catch-all for any other unexpected errors during the process.
    except Exception:
        logger.exception("An unexpected error occurred during text extraction.", extra={"page": request.page_number})
        raise AppError(status_code=500, code="extraction_failed",
                       message="An internal error occurred while processing the page.")

