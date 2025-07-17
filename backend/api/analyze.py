# backend/api/analyze.py

import logging
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Corrected: Use absolute imports from the project root ('backend.')
from backend.core.llm_client import LLMClient, AgentResult
from backend.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- API Router and Client Initialization ---

# Create an API router to organize this endpoint
router = APIRouter(prefix="/api")

# Initialize the LLM client with credentials from the application settings
llm_client = LLMClient(
    api_base=settings.OPENAI_API_BASE,
    api_key=settings.OPENAI_API_KEY
)

# --- Pydantic Model for API Request Body ---

class AnalysisRequest(BaseModel):
    """
    Defines the structure of the request body for the /analyze endpoint.
    FastAPI uses this model to validate incoming request data automatically.
    """
    name: str = Field(..., description="The name of the agent to run.")
    prompt: str = Field(..., description="The system prompt defining the agent's task.")
    documents: List[Dict[str, Any]] = Field(..., description="A list of documents for analysis.")
    context: Optional[str] = Field(None, description="Optional user-provided context for the analysis.")


# --- API Endpoint Definition ---

@router.post("/analyze", response_model=AgentResult)
async def analyze(request: AnalysisRequest) -> AgentResult:
    """
    Endpoint to run a single agent's analysis on a set of documents.

    This endpoint receives the agent definition, documents, and context,
    then uses the LLMClient to perform the analysis and returns the
    structured result.

    Args:
        request (AnalysisRequest): The validated request body containing all
                                   necessary information for the analysis.

    Returns:
        AgentResult: The structured result from the agent's analysis.

    Raises:
        HTTPException:
            - 500: If an internal server error occurs during analysis.
            - 400: If the LLM client returns a validation error (e.g., bad response format).
    """
    logger.info(f"Received analysis request for agent: {request.name}")
    try:
        # Delegate the core logic to the LLM client instance
        result = await llm_client.analyze_agent(
            name=request.name,
            prompt=request.prompt,
            documents=request.documents,
            context=request.context,
        )
        return result
    except ValueError as e:
        # Handle specific errors from the LLM client (e.g., bad JSON)
        logger.error(f"Validation error during analysis for agent '{request.name}': {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle any other unexpected exceptions
        logger.exception(f"An unexpected error occurred while processing agent '{request.name}': {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An internal error occurred during analysis for agent '{request.name}'.",
        )
