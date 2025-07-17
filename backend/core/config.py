# backend/core/config.py

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file for local development
load_dotenv()

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

    # An optional root URL path if the application is hosted under a sub-path.
    # e.g., "/my-app". Defaults to an empty string if not set.
    ROOT_URL: str = ""

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
