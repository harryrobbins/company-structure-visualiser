# api/llm_interface.py (Updated)
# Decouples the extraction logic from the global client instance.

import logging
from openai import AsyncOpenAI, AsyncAzureOpenAI
from . import prompts
from .llm_client import get_model_name
from companies_duck_house.models import Company

logger = logging.getLogger(__name__)


async def extract_text_from_image(
        client: AsyncOpenAI | AsyncAzureOpenAI,
        image_data: str
) -> str | None:
    """
    Sends an image to the LLM and asks it to extract text using a standardized prompt.
    This function now accepts the client instance, making it more testable and reusable.

    Args:
        client: An initialized async OpenAI or AzureOpenAI client.
        image_data: A base64 encoded string of the PNG image (data URL).

    Returns:
        The extracted text as a string, or None if the model returns no content.

    Raises:
        Exception: Propagates exceptions from the LLM client for centralized handling.
    """
    model_name = get_model_name()
    logger.info(f"Sending image to model '{model_name}' for text extraction.")

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompts.EXTRACT_TEXT_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_data},
                        },
                    ],
                }
            ],
            max_tokens=4096,  # Set a reasonable limit
        )
        extracted_text = response.choices[0].message.content
        logger.info("Successfully received text from LLM.")
        return extracted_text
    except Exception as e:
        logger.error(f"An error occurred while communicating with the LLM: {e}", exc_info=True)
        # Re-raise the exception to be handled by the global exception handler.
        raise


async def recommend_best_match(
    client: AsyncOpenAI | AsyncAzureOpenAI,
    query: str,
    matches: list[Company]
) -> str | None:
    """
    Sends a query and a list of matches to the LLM and asks it to recommend the best match.

    Args:
        client: An initialized async OpenAI or AzureOpenAI client.
        query: The original search query.
        matches: A list of potential company matches.

    Returns:
        The company number of the recommended match, or None if the model returns no content.
    """
    model_name = get_model_name()
    logger.info(f"Sending query and matches to model '{model_name}' for recommendation.")

    # Format the matches for the prompt
    formatted_matches = "\n".join([f"- {match.company_number}: {match.company_name}" for match in matches])

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": prompts.RECOMMEND_BEST_MATCH_PROMPT.format(query=query, matches=formatted_matches),
                }
            ],
            max_tokens=20,
        )
        recommended_company_number = response.choices[0].message.content
        logger.info(f"Successfully received recommendation from LLM: {recommended_company_number}")
        return recommended_company_number.strip()
    except Exception as e:
        logger.error(f"An error occurred while communicating with the LLM: {e}", exc_info=True)
        raise

