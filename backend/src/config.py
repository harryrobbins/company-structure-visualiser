# src/api/config.py
"""
Centralized configuration management using Pydantic-Settings.

This module defines a Settings class that loads configuration from environment
variables or a .env file, providing default values for the application.
"""
from pathlib import Path
from typing import Optional, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Defines the application's configuration settings.
    
    Pydantic-Settings will automatically attempt to load values for these fields
    from environment variables (case-insensitive) or a .env file.
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
    
    # --- Database Settings ---
    db_dir: str = "db"
    data_dir: str = "data"
    db_path: str = "db/companies.duckdb"
    test_db_path: str = "db/test_companies.duckdb"

    # Path to the source data file for initial database creation.
    # Defaults to the large CSV file in the project root.
    data_source: str = "../BasicCompanyDataAsOneFile-2025-09-01.csv"

    # Flag to force recreation of the database on startup.
    force_recreate_db: bool = False

    # Configure Pydantic-Settings to look for a .env file in the project root.
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding='utf-8',
        extra='ignore'
    )


# Create a single, reusable instance of the settings.
settings = Settings()
