# api/models.py
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from src.companies_duck_house.models import Company


class CompanyMatchRequest(BaseModel):
    """
    Defines the structure for the company matching request.
    It expects a list of one or more company names to search for.
    """

    company_names: List[str] = Field(
        ...,
        min_length=1,
        description="A non-empty list of company names to find matches for.",
    )


class CompanyMatch(BaseModel):
    """
    Represents the result of a company match, including a recommended match
    and a list of other potential matches.
    """
    recommended_match: Optional[Company] = None
    other_matches: List[Company]


class CompanyMatchResponse(BaseModel):
    """
    Defines the response structure for the company matching endpoint.
    The keys of the 'matches' dictionary are the original search terms.
    The values are objects containing the recommended match and other matches.
    """

    matches: Dict[str, CompanyMatch]


class ImageExtractionRequest(BaseModel):
    """
    Defines the structure for the image extraction request.
    """
    page_number: int
    image_data: str


class TextExtractionResponse(BaseModel):
    """
    Defines the response structure for the text extraction endpoint.
    """
    page_number: int
    text: str
