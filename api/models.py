# api/models.py

from pydantic import BaseModel, Field

"""
This module defines the Pydantic models for the application.
These models are used for data validation and serialization in the API,
ensuring that data conforms to a specific structure.
"""

class ImageExtractionRequest(BaseModel):
    """
    Defines the expected structure for incoming requests to the /extract_text endpoint.
    """
    page_number: int = Field(..., description="The page number of the PDF, 1-indexed.")
    image_data: str = Field(..., description="Base64-encoded PNG image data as a string, starting with 'data:image/png;base64,'.")

class TextExtractionResponse(BaseModel):
    """
    Defines the structure of the response sent back to the client after text extraction.
    """
    page_number: int
    text: str

