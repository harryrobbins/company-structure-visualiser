# backend/src/api/dependencies.py
"""
This module provides dependency injectors for the FastAPI application and handles
the initial creation of the database if it does not exist.
"""

import os
from src.companies_duck_house.core import CompaniesHouseDB
from src.config import settings  # Import the centralized settings

db_instance: CompaniesHouseDB | None = None

def initialize_database():
    """
    Initializes the database. If the DB file doesn't exist or if a force
    recreation is requested, it builds the DB from the specified data source.
    """
    global db_instance

    db_exists = os.path.exists(settings.db_path)

    if settings.force_recreate_db and db_exists:
        print(f"FORCE_RECREATE_DB is true. Deleting existing database at {settings.db_path}")
        os.remove(settings.db_path)
        db_exists = False

    if not db_exists:
        print(f"Database not found at '{settings.db_path}'.")
        if not os.path.exists(settings.data_source):
            print(f"FATAL: Data source not found at '{settings.data_source}'. Cannot create database.")
            print("Please ensure the source file exists or set the COMPANIES_HOUSE_DATA_SOURCE environment variable.")
            db_instance = None
            return
        
        print(f"Creating database from source: '{settings.data_source}'...")
        temp_instance = CompaniesHouseDB(db_path=settings.db_path)
        try:
            with temp_instance as db:
                db.create_database_from_source(settings.data_source)
            print("Database created successfully.")
        except Exception as e:
            print(f"FATAL: Failed to create database from '{settings.data_source}'. Error: {e}")
            # Clean up partially created file if creation fails
            if os.path.exists(settings.db_path):
                os.remove(settings.db_path)
            db_instance = None
            return

    # --- Connect to the database ---
    try:
        print(f"Connecting to database at '{settings.db_path}'...")
        db_instance = CompaniesHouseDB(db_path=settings.db_path)
        db_instance.connect()
        print("Database connection successful.")
    except Exception as e:
        print(f"FATAL: Could not connect to Companies House DB at '{settings.db_path}'. Error: {e}")
        db_instance = None

# --- Application Startup Logic ---
# This function is called once when the FastAPI application starts.
initialize_database()


def get_db() -> CompaniesHouseDB:
    """
    FastAPI dependency to provide a connected CompaniesHouseDB instance.
    """
    if db_instance is None:
        # This will be raised if the database failed to initialize on startup
        raise RuntimeError("Database connection is not available.")
    return db_instance
