import asyncio
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from .models import CompanySearchResponse, CompanySearchRequest, CompanyMatch

router = APIRouter(prefix="/api")

@router.post("/search/companies", response_model=List[CompanySearchResponse])
async def search_companies(requests: List[CompanySearchRequest]) -> List[CompanySearchResponse]:
    """
    Search for companies by name and return structured search results.
    - Accepts a list of `CompanySearchRequest` objects.
    - Returns a list of `CompanySearchResponse` objects with best match and other matches.
    """
    if not requests:
        return []

    # Process searches concurrently for better performance
    tasks = [search_single_company(request) for request in requests]
    results = await asyncio.gather(*tasks)

    return results


async def search_single_company(request: CompanySearchRequest) -> CompanySearchResponse:
    """
    Perform search for a single company request.
    This is a placeholder implementation - replace with your actual search logic.
    """
    # Mock search logic - replace with actual database query
    # You would typically query your DuckDB database here
    matches = await perform_company_search(request.company_name)

    if not matches:
        return CompanySearchResponse(
            search_string=request.company_name,
            best_match=None,
            other_matches=[]
        )

    best_match = await pick_best_match(matches)
    return CompanySearchResponse(
        search_string=request.company_name,
        best_match=best_match,
        other_matches=[m for m in matches if m != best_match] if best_match else matches
    )

async def perform_company_search(search_term: str) -> List[CompanyMatch]:
    """
    Placeholder for actual database search implementation.
    Replace this with your DuckDB query logic.
    """
    # TODO: Implement actual database search
    # Example structure for what this function should return:
    return [
        CompanyMatch(
            company_name=search_term,
            company_number="12345678",
            regaddress_addressline1="123 Business Street",
            regaddress_posttown="London",
            regaddress_country="England",
            regaddress_postcode="SW1A 1AA",
            company_category="Private Limited Company",
            company_status="Active",
            country_of_origin="United Kingdom",
            incorporation_date="2020-01-15",
            siccode_sictext_1="Computer programming activities",
            score=0.95
        )
    ]

async def pick_best_match(matches: List[CompanyMatch]) -> Optional[CompanyMatch]:
    """
    Pick the best match from a list of CompanyMatch objects.
    This is a placeholder implementation - replace with your actual logic.
    """
    if not matches:
        return None

    # Example logic: pick the match with the highest score
    best_match = max(matches, key=lambda x: x.score)
    return best_match