# backend/src/api/dependencies.py
"""
This module provides dependency injectors for the FastAPI application and handles
the initial creation of the database if it does not exist.
"""

import os
from companies_duck_house.core import CompaniesHouseDB
from config import settings
import urllib.request

db_instance: CompaniesHouseDB | None = None

def initialize_database():
    """
    Initializes the database. If the DB file doesn't exist or if a force
    recreation is requested, it builds the DB from the specified data source.
    """
    global db_instance

    # Determine if db_path is a URL
    is_url = settings.db_path.startswith(('http://', 'https://'))

    if is_url:
        # Use a well-known name in tmpdir
        local_db_path = os.path.join(settings.tmpdir, "company_structure_api.duckdb")

        # Download if file doesn't exist or force recreation is requested
        should_download = settings.force_recreate_db or not os.path.exists(local_db_path)

        if should_download:
            if settings.force_recreate_db and os.path.exists(local_db_path):
                print(f"FORCE_RECREATE_DB is true. Deleting existing database at {local_db_path}")
                os.remove(local_db_path)

            print(f"Downloading database from {settings.db_path} to {local_db_path}...")
            try:
                os.makedirs(settings.tmpdir, exist_ok=True)
                urllib.request.urlretrieve(settings.db_path, local_db_path)
                print("Database downloaded successfully.")
            except Exception as e:
                print(f"FATAL: Failed to download database from {settings.db_path}. Error: {e}")
                db_instance = None
                return

        # Use the local path for the rest of the initialization
        effective_db_path = local_db_path
    else:
        effective_db_path = settings.db_path
        db_exists = os.path.exists(effective_db_path)

        if settings.force_recreate_db and db_exists:
            print(f"FORCE_RECREATE_DB is true. Deleting existing database at {effective_db_path}")
            os.remove(effective_db_path)
            db_exists = False

        if not db_exists:
            print(f"Database not found at '{effective_db_path}'.")
            if not os.path.exists(settings.data_source):
                print(f"FATAL: Data source not found at '{settings.data_source}'. Cannot create database.")
                print("Please ensure the source file exists or set the COMPANIES_HOUSE_DATA_SOURCE environment variable.")
                db_instance = None
                return

            print(f"Creating database from source: '{settings.data_source}'...")
            temp_instance = CompaniesHouseDB(db_path=effective_db_path)
            try:
                with temp_instance as db:
                    db.create_database_from_source(settings.data_source)
                print("Database created successfully.")
            except Exception as e:
                print(f"FATAL: Failed to create database from '{settings.data_source}'. Error: {e}")
                if os.path.exists(effective_db_path):
                    os.remove(effective_db_path)
                db_instance = None
                return

    # Connect to the database
    try:
        print(f"Connecting to database at '{effective_db_path}'...")
        db_instance = CompaniesHouseDB(db_path=effective_db_path)
        db_instance.connect()
        print("Database connection successful.")
    except Exception as e:
        print(f"FATAL: Could not connect to Companies House DB at '{effective_db_path}'. Error: {e}")
        db_instance = None


def get_db() -> CompaniesHouseDB:
    """
    FastAPI dependency to provide a connected CompaniesHouseDB instance.
    """
    if db_instance is None:
        # This will be raised if the database failed to initialize on startup
        raise RuntimeError("Database connection is not available.")
    return db_instance
