import os
from pathlib import Path
import sys

# Add the project root to the Python path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from companies_duck_house.core import CompaniesHouseDB
from config import settings

def rebuild_database():
    """
    Forces a rebuild of the production database.
    """
    db_path = Path(settings.db_path)
    
    if db_path.exists():
        print(f"Removing existing database at {db_path}...")
        os.remove(db_path)

    print(f"Creating new database at {db_path}...")
    db = CompaniesHouseDB(db_path=str(db_path))
    with db:
        db.create_database_from_source(source=settings.data_source)
    print("Database rebuild complete.")

if __name__ == "__main__":
    rebuild_database()
