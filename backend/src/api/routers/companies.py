# backend/src/api/companies_router.py

"""
API router for company-related endpoints.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI, AsyncAzureOpenAI

from companies_duck_house.core import CompaniesHouseDB
from api.dependencies import get_db
from api.models import CompanyMatchRequest, CompanyMatchResponse, CompanyMatch
from api.llm_client import LLMClientDep
from api.llm_interface import recommend_best_match

logger = logging.getLogger(__name__)

# --- API Router Initialization ---
router = APIRouter(prefix="/api")


@router.post(
    "/match-companies",
    response_model=CompanyMatchResponse,
    tags=["Companies"]
)
async def match_companies(
    request: CompanyMatchRequest,
    db: CompaniesHouseDB = Depends(get_db),
    llm_client: AsyncOpenAI | AsyncAzureOpenAI = LLMClientDep,
):
    """
    Accepts a list of company names and returns the closest matches
    from the Companies House database using Full-Text Search.
    For each name, it uses an LLM to recommend the best match.
    """
    logger.info(
        f"Received request to match {len(request.company_names)} company names."
    )
    results = {}
    try:
        for name in request.company_names:
            matches = db.search_companies_by_name(name, limit=5)

            if not matches:
                results[name] = CompanyMatch(recommended_match=None, other_matches=[])
                continue

            recommended_company_number = await recommend_best_match(
                client=llm_client,
                query=name,
                matches=matches
            )

            recommended_match = None
            other_matches = []

            if recommended_company_number:
                for match in matches:
                    if match.company_number == recommended_company_number:
                        recommended_match = match
                    else:
                        other_matches.append(match)
            
            if not recommended_match:
                # if LLM fails or returns invalid number, return all as other_matches
                other_matches = matches

            results[name] = CompanyMatch(
                recommended_match=recommended_match,
                other_matches=other_matches
            )

        return CompanyMatchResponse(matches=results)

    except ConnectionError as e:
        logger.error(f"Database connection error during company match: {e}")
        raise HTTPException(
            status_code=503,
            detail="The service is currently unable to connect to the database.",
        )
    except Exception:
        # Generic catch-all for other unexpected errors.
        logger.exception("An unexpected error occurred during company matching.")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred while matching companies.",
        )
