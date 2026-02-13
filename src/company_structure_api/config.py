from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    custom_openai_api_key_header: str | None = None
    openai_model_name: str = "gpt-4.1-mini"
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    
    # --- Database Settings ---
    data_dir: str = "data"
    db_path: str = "db/companies.duckdb"
    test_db_path: str = "db/test_companies.duckdb"

    # Path to the source data file for initial database creation.
    # Defaults to the large CSV file in the project root.
    data_source: str = "BasicCompanyDataAsOneFile-2026-02-01.zip"

    # Flag to force recreation of the database on startup.
    force_recreate_db: bool = False

    # Configure Pydantic-Settings to look for a .env file in the project root.
    model_config = SettingsConfigDict(
        env_file=(".env.local", ".env"),
        env_file_encoding='utf-8',
        extra='ignore'
    )