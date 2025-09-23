# api/llm_client.py (Updated)
# Manages LLM client creation and configuration via dependency injection.

import logging
from typing import AsyncGenerator
import openai
from fastapi import Depends

from config import settings
from .errors import AppError

# Get a logger instance. Note: No basicConfig here.
logger = logging.getLogger(__name__)

# A global cache for the client to avoid re-creating it on every request.
_llm_client = None


def get_llm_client():
    """
    Factory function to create and configure the appropriate async LLM client.
    This function is now designed to be used with FastAPI's dependency injection.
    It lazily initializes the client and caches it globally.
    """
    global _llm_client
    if _llm_client:
        return _llm_client

    logger.info(f"Initializing LLM client for provider: '{settings.LLM_PROVIDER}'")

    try:
        if settings.LLM_PROVIDER == "azure":
            if not all([settings.AZURE_OPENAI_ENDPOINT, settings.AZURE_OPENAI_API_KEY,
                        settings.AZURE_OPENAI_DEPLOYMENT_NAME]):
                raise ValueError("Azure provider is selected, but one or more required Azure settings are missing.")

            logger.info(f"Using Azure endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
            _llm_client = openai.AsyncAzureOpenAI(
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.OPENAI_API_VERSION,
            )
        else:  # Default to standard OpenAI
            if not settings.OPENAI_API_KEY:
                raise ValueError("OpenAI provider is selected, but OPENAI_API_KEY is missing.")

            if settings.OPENAI_BASE_URL:
                logger.info(f"Using custom OpenAI base URL: {settings.OPENAI_BASE_URL}")

            _llm_client = openai.AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL
            )

        return _llm_client

    except ValueError as e:
        logger.exception("LLM client configuration error")
        # This error will be caught on startup if the dependency is used.
        raise RuntimeError(f"LLM Client Initialization Failed: {e}") from e


def get_model_name() -> str:
    """Returns the correct model or deployment name based on the configured provider."""
    if settings.LLM_PROVIDER == "azure":
        if not settings.AZURE_OPENAI_DEPLOYMENT_NAME:
            raise ValueError("Azure provider is selected, but AZURE_OPENAI_DEPLOYMENT_NAME is missing.")
        return settings.AZURE_OPENAI_DEPLOYMENT_NAME
    return settings.OPENAI_MODEL_NAME


# This is the dependency that will be used in the API router.
LLMClientDep = Depends(get_llm_client)
