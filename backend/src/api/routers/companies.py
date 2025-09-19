# backend/src/api/companies_router.py

"""
API router for company-related endpoints.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from src.companies_duck_house.core import CompaniesHouseDB
from src.api.dependencies import get_db
from src.api.models import CompanyMatchRequest, CompanyMatchResponse

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
    db: CompaniesHouseDB = Depends(get_db)
):
    """
    Accepts a list of company names and returns the closest matches
    from the Companies House database using Full-Text Search.
    """
    logger.info(
        f"Received request to match {len(request.company_names)} company names."
    )
    results = {}
    try:
        for name in request.company_names:
            # For each name in the request, perform a search.
            # The `search_companies_by_name` method is defined in your core logic.
            # We can also set a limit for the number of matches per name.
            matches = db.search_companies_by_name(name, limit=5)
            results[name] = matches

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
