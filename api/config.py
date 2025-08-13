# api/config.py (Updated)
# Centralizes configuration and aligns with standardized environment variables.

import os
from pathlib import Path
from typing import Optional, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Manages application settings and configuration loaded from a .env file.
    Using pydantic-settings ensures type-safe and validated configuration.
    Variable names directly map to the environment variables.
    """
    # --- Provider Settings ---
    # Determines which LLM provider to use: 'openai' or 'azure'.
    LLM_PROVIDER: Literal["openai", "azure"] = "openai"

    # --- Standard OpenAI Settings ---
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL_NAME: str = "gpt-4o-mini" # A model that supports vision
    OPENAI_BASE_URL: Optional[str] = None

    # --- Azure OpenAI Settings ---
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    AZURE_OPENAI_API_KEY: Optional[str] = None
    OPENAI_API_VERSION: str = "2024-02-01"
    AZURE_OPENAI_DEPLOYMENT_NAME: Optional[str] = None

    # --- Application Settings ---
    # The root path for deploying the app under a sub-directory.
    ROOT_PATH: str = ""
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        # Load settings from a .env file located in the project's root directory
        env_file=Path(__file__).resolve().parent.parent / ".env",
        env_file_encoding='utf-8',
        extra='ignore'
    )

# Instantiate the settings object to be imported by other modules.
settings = Settings()
