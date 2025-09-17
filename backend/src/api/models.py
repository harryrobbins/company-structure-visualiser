# api/models.py (Updated)
# Adds strong validation to the request model.

from pydantic import BaseModel, Field, constr

class ImageExtractionRequest(BaseModel):
    """
    Defines and validates the structure for incoming requests to the /extract_text endpoint.
    """
    page_number: int = Field(
        ...,
        gt=0,
        description="The page number of the PDF, must be a positive integer (1-indexed)."
    )
    image_data: constr(pattern=r"^data:image/png;base64,") = Field(
        ...,
        description="Base64-encoded PNG image data as a string, which must start with 'data:image/png;base64,'."
    )

class TextExtractionResponse(BaseModel):
    """
    Defines the structure of the response sent back to the client after successful text extraction.
    """
    page_number: int
    text: str
