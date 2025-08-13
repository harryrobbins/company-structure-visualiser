# api/llm_client.py
import logging
import openai
# Use a relative import to find config.py in the same directory.
from .config import settings

# Configure basic logging.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_llm_client():
    """
    Factory function to get the appropriate async LLM client based on settings.
    """
    if settings.LLM_PROVIDER == "azure":
        logger.info("Initializing Azure OpenAI Client.")
        if not all([settings.AZURE_OPENAI_ENDPOINT, settings.AZURE_OPENAI_API_KEY, settings.OPENAI_API_VERSION]):
            raise ValueError("Azure provider is selected, but one or more Azure settings are missing.")
        logger.info(f"Using Azure endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
        return openai.AsyncAzureOpenAI(
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.OPENAI_API_VERSION,
        )
    else:
        # Default to standard OpenAI client
        logger.info("Initializing Standard OpenAI Client.")
        if not settings.OPENAI_API_KEY:
            raise ValueError("OpenAI provider is selected, but OPENAI_API_KEY is missing.")

        if settings.OPENAI_BASE_URL:
            logger.info(f"Using custom base URL: {settings.OPENAI_BASE_URL}")

        return openai.AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )


def get_model_name() -> str:
    """Returns the correct model/deployment name based on the provider."""
    if settings.LLM_PROVIDER == "azure":
        if not settings.AZURE_OPENAI_DEPLOYMENT_NAME:
            raise ValueError("Azure provider is selected, but AZURE_OPENAI_DEPLOYMENT_NAME is missing.")
        return settings.AZURE_OPENAI_DEPLOYMENT_NAME
    return settings.OPENAI_MODEL_NAME
