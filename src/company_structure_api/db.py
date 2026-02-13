import os
import sysconfig
import zipfile
import logging
from pathlib import Path
from typing import Optional

import duckdb
import httpx
from rich.progress import (
    BarColumn,
    DownloadColumn,
    Progress,
    TimeRemainingColumn,
    TransferSpeedColumn,
)

from company_structure_api.models import CompanyMatch
from company_structure_api.models import Company, PYDANTIC_TO_DUCKDB
from company_structure_api.config import Settings

logger = logging.getLogger(__name__)

async def initialize_database(config: Settings) -> CompaniesHouseDB:
    """
    Initializes the database. If the DB file doesn't exist or if a force
    recreation is requested, it builds the DB from the specified data source.
    """
    Path(config.db_path).parent.mkdir(exist_ok=True)
    db_exists = os.path.exists(config.db_path)

    if config.force_recreate_db and db_exists:
        logger.info(f"FORCE_RECREATE_DB is true. Deleting existing database at {config.db_path}")
        os.remove(config.db_path)
        db_exists = False

    if not db_exists:
        logger.info(f"Database not found at '{config.db_path}'.")
        if not os.path.exists(config.data_source):
            logger.exception(f"FATAL: Data source not found at '{config.data_source}'. Cannot create database.")
            raise

        logger.info(f"Creating database from source: '{config.data_source}'...")
        temp_instance = CompaniesHouseDB(db_path=config.db_path)
        try:
            with temp_instance as db:
                await db.create_database_from_source(config)
            logger.info("Database created successfully.")
        except Exception:
            logger.exception(f"FATAL: Failed to create database from '{config.data_source}'")
            if os.path.exists(config.db_path):
                os.remove(config.db_path)
            raise

    logger.info(f"Connecting to database at '{config.db_path}'...")
    db_instance = CompaniesHouseDB(db_path=config.db_path)
    db_instance.connect()
    logger.info("Database connection successful.")
    return db_instance

class CompaniesHouseDB:
    COMPANIES_TABLE_NAME = "companies"
    FTS_INDEX_NAME = "companies_fts_idx"

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.con = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

    def connect(self):
        if self.con:
            logger.info("Already connected.")
            return

        logger.info(f"Connecting to DuckDB at: {self.db_path}")
        self.con = duckdb.connect(database=self.db_path, read_only=False)
        try:
            duckdb_fts_extension_path = str(Path(sysconfig.get_path('purelib')) / "duckdb_extension_fts" / "extensions" / "v1.4.3" / "fts.duckdb_extension")
            logger.info(f"Installing and loading DuckDB FTS extension from: {duckdb_fts_extension_path}")
            self.con.execute(f"FORCE INSTALL '{duckdb_fts_extension_path}';")
            self.con.execute(f"LOAD '{duckdb_fts_extension_path}';")
            logger.info("FTS extension installed and loaded successfully.")
        except Exception:
            logger.exception("Failed to install or load DuckDB FTS extension.")
            raise

    def disconnect(self):
        if self.con:
            self.con.close()
            self.con = None
            logger.info("Database connection closed.")

    def table_exists(self, table_name: str) -> bool:
        """Checks if a table exists in the database."""
        if not self.con:
            raise ConnectionError("Database is not connected.")
        try:
            self.con.execute(f"SELECT 1 FROM {table_name} LIMIT 1;")
            return True
        except duckdb.CatalogException:
            return False

    async def create_database_from_source(self, config: Settings):
        if not self.con:
            raise ConnectionError("Database is not connected. Please connect first.")

        self.con.execute("DROP TABLE IF EXISTS " + self.COMPANIES_TABLE_NAME)

        source_path = Path(config.data_source)
        data_dir = Path(config.data_dir)
        data_dir.mkdir(exist_ok=True)

        if config.data_source.startswith(("http://", "https")):
            zip_path = data_dir / "BasicCompanyData.zip"
            await self._download_file(config.data_source, zip_path)
            csv_file_path = self._unzip_first_file(zip_path, data_dir)
        elif source_path.is_file() and source_path.suffix == ".zip":
            csv_file_path = self._unzip_first_file(source_path, data_dir)
        elif source_path.is_file() and source_path.suffix == ".csv":
            csv_file_path = source_path
        else:
            raise ValueError(f"Invalid source: '{config.data_source}'. Must be a URL or a path to a .zip or .csv file.")

        if not csv_file_path:
            raise FileNotFoundError("Could not find a CSV file to load.")

        logger.info(f"Loading data from '{csv_file_path}' into table '{self.COMPANIES_TABLE_NAME}'...")
        safe_csv_path = csv_file_path.as_posix()

        columns_definition = {}
        select_clauses = []
        for field_name, field_info in Company.model_fields.items():
            original_name = field_info.alias
            field_type = field_info.annotation
            if hasattr(field_type, '__args__'):
                field_type = field_type.__args__[0]
            columns_definition[original_name] = PYDANTIC_TO_DUCKDB.get(field_type, 'VARCHAR')
            select_clauses.append(f'"{original_name}" AS {field_name}')

        select_statement = ",\n".join(select_clauses)

        self.con.execute(f"""
            CREATE TABLE {self.COMPANIES_TABLE_NAME} AS
            SELECT 
                {select_statement}
            FROM read_csv(
                '{safe_csv_path}', header=true, auto_detect=false, normalize_names=false,
                delim=',', quote='"', dateformat='%d/%m/%Y', columns={columns_definition}, escape='"'
            );
        """)
        logger.info("Data loaded successfully.")
        self._create_fts_index()

    def _create_fts_index(self):
        """Creates a full-text search index on company name and number."""
        logger.info(f"Creating FTS index on table '{self.COMPANIES_TABLE_NAME}'...")
        self.con.execute(f"""
            PRAGMA create_fts_index('{self.COMPANIES_TABLE_NAME}', 'company_number', 'company_name', overwrite=1);
        """
        )
        logger.info("FTS index created successfully.")

    async def _download_file(self, url: str, dest_path: Path):
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", url) as r:
                r.raise_for_status()
                total_size = int(r.headers.get("content-length", 0))
                with Progress("[progress.description]{task.description}", BarColumn(), DownloadColumn(),
                              TransferSpeedColumn(), "ETA:", TimeRemainingColumn()) as progress:
                    task = progress.add_task(f"Downloading {dest_path.name}", total=total_size)
                    with open(dest_path, "wb") as f:
                        async for chunk in r.aiter_bytes(chunk_size=8192):
                            f.write(chunk)
                            progress.update(task, advance=len(chunk))

    def _unzip_first_file(self, zip_path: Path, extract_dir: Path) -> Path:
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            file_to_extract = zip_ref.namelist()[0]
            zip_ref.extract(file_to_extract, extract_dir)
            return extract_dir / file_to_extract

    def search_companies_by_name(self, name_fragment: str, limit: int = 10) -> list[CompanyMatch]:
        """Performs a full-text search on the company_name column."""
        if not self.con:
            raise ConnectionError("Database is not connected.")

        # Using a subquery and explicitly targeting the 'company_name' field for the search.
        query = f"""
            SELECT score, *
            FROM (
                SELECT
                    *,
                    fts_main_{self.COMPANIES_TABLE_NAME}.match_bm25(
                        company_number,
                        ?,
                        fields := 'company_name'
                    ) AS score
                FROM {self.COMPANIES_TABLE_NAME}
            ) sq
            WHERE score IS NOT NULL
            ORDER BY score DESC
            LIMIT ?;
        """
        results = self.con.execute(query, [name_fragment, limit]).fetch_arrow_table().to_pylist()
        return [CompanyMatch.model_validate(row) for row in results]

    def get_company_by_number(self, company_number: str) -> Optional[Company]:
        """Retrieves a single company by its exact company number."""
        if not self.con:
            raise ConnectionError("Database is not connected.")
        query = f"SELECT * FROM {self.COMPANIES_TABLE_NAME} WHERE company_number = ?;"
        results = self.con.execute(query, [company_number]).fetch_arrow_table().to_pylist()
        return Company.model_validate(results[0]) if results else None