# backend/core/config.py

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file for local development
load_dotenv()

def get_root_url() -> str:
    """
    Determines the root URL for the application, making it environment-aware.

    - In a Posit Connect environment, it uses the `CONNECT_SERVER_URL_PATH_PREFIX`.
    - Otherwise, it falls back to the `ROOT_URL` environment variable for other
      deployment types (like Docker).
    - If neither is set, it defaults to an empty string ("") for local development.
    """
    # Posit Connect provides this environment variable for deployed applications.
    posit_prefix = os.getenv("CONNECT_SERVER_URL_PATH_PREFIX")
    if posit_prefix:
        # The prefix from Posit often ends with a slash, which FastAPI's
        # root_path doesn't need, so we remove it.
        return posit_prefix.rstrip('/')

    # Fallback for other environments (e.g., Docker with a ROOT_URL var).
    return os.getenv("ROOT_URL", "")


class Settings(BaseSettings):
    """
    Application configuration settings, loaded from the environment or a .env file.
    Pydantic's BaseSettings provides validation and type hints for configuration.
    """
    # The base URL for the OpenAI-compatible API endpoint.
    # e.g., "https://api.openai.com/v1" or a private endpoint.
    OPENAI_API_BASE: str

    # The API key for authenticating with the OpenAI-compatible service.
    OPENAI_API_KEY: str

    # MODIFICATION: The root URL is now determined dynamically by the get_root_url
    # function when the settings are loaded. This allows the app to automatically
    # adapt to its deployment environment without code changes.
    ROOT_URL: str = get_root_url()

    class Config:
        """
        Pydantic settings configuration.
        - env_file: Specifies the file to load environment variables from.
        - extra: Allows for extra fields to be defined in the environment
                 without causing a validation error.
        """
        env_file = ".env"
        extra = "ignore"

# Create a single, reusable instance of the settings for the application
settings = Settings()
