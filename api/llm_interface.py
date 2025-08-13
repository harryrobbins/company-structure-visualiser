# api/llm_interface.py

import logging
# Use relative imports for sibling modules.
from .llm_client import get_llm_client, get_model_name
from . import prompts

# --- Setup ---
logger = logging.getLogger(__name__)
client = get_llm_client()
model_name = get_model_name()

async def extract_text_from_image(image_data: str) -> str | None:
    """
    Sends an image to the LLM and asks it to extract text using a standardized prompt.

    Args:
        image_data: A base64 encoded string of the PNG image.

    Returns:
        The extracted text as a string, or None if an error occurs.
    """
    logger.info(f"Sending image to model '{model_name}' for text extraction.")
    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompts.EXTRACT_TEXT_PROMPT
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_data,
                            },
                        },
                    ],
                }
            ]
        )
        extracted_text = response.choices[0].message.content
        logger.info("Successfully received text from LLM.")
        return extracted_text
    except Exception as e:
        logger.error(f"An error occurred while communicating with the LLM: {e}", exc_info=True)
        raise
