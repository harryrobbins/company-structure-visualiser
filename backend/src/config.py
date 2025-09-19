# src/api/config.py
"""
Centralized configuration management using Pydantic-Settings.

This module defines a Settings class that loads configuration from environment
variables or a .env file, providing default values for the application.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Defines the application's configuration settings.
    
    Pydantic-Settings will automatically attempt to load values for these fields
    from environment variables (case-insensitive) or a .env file.
    """
    # Directory to store data files.
    data_dir: str = "data"

    # Path to the DuckDB database file.
    db_path: str = "data/companies.duckdb"

    # Path to the source data file for initial database creation.
    # Defaults to the large CSV file in the project root.
    data_source: str = "../BasicCompanyDataAsOneFile-2025-09-01.csv"

    # Flag to force recreation of the database on startup.
    force_recreate_db: bool = False

    openai_api_base: str = None
    openai_api_key: str = None
    llm_model: str = None

    # Configure Pydantic-Settings to look for a .env file in the project root.
    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding='utf-8')


# Create a single, reusable instance of the settings.
settings = Settings()