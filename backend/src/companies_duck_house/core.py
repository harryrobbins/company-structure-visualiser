import os
import zipfile
from pathlib import Path
from typing import Optional

import duckdb
import requests
from rich.progress import (
    BarColumn,
    DownloadColumn,
    Progress,
    TimeRemainingColumn,
    TransferSpeedColumn,
)

from api.models import CompanyMatch
from .models import Company, PYDANTIC_TO_DUCKDB
from config import settings


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
            print("Already connected.")
            return

        print(f"Connecting to DuckDB at: {self.db_path}")
        self.con = duckdb.connect(database=self.db_path, read_only=False)
        try:
            self.con.execute("INSTALL fts;")
            self.con.execute("LOAD fts;")
            print("FTS extension installed and loaded successfully.")
        except Exception as e:
            print(
                f"Failed to install or load DuckDB FTS extension. Error: {e}"
            )
            raise

    def disconnect(self):
        if self.con:
            self.con.close()
            self.con = None
            print("Database connection closed.")

    def table_exists(self, table_name: str) -> bool:
        """Checks if a table exists in the database."""
        if not self.con:
            raise ConnectionError("Database is not connected.")
        try:
            self.con.execute(f"SELECT 1 FROM {table_name} LIMIT 1;")
            return True
        except duckdb.CatalogException:
            return False

    def create_database_from_source(self, source: str):
        if not self.con:
            raise ConnectionError("Database is not connected. Please connect first.")

        self.con.execute("DROP TABLE IF EXISTS " + self.COMPANIES_TABLE_NAME)

        source_path = Path(source)
        data_dir = Path(settings.data_dir)
        data_dir.mkdir(exist_ok=True)
        csv_file_path = None

        if source.startswith(("http://", "https")):
            zip_path = data_dir / "BasicCompanyData.zip"
            self._download_file(source, zip_path)
            csv_file_path = self._unzip_first_file(zip_path, data_dir)
        elif source_path.is_file() and source_path.suffix == ".zip":
            csv_file_path = self._unzip_first_file(source_path, data_dir)
        elif source_path.is_file() and source_path.suffix == ".csv":
            csv_file_path = source_path
        else:
            raise ValueError(f"Invalid source: '{source}'. Must be a URL or a path to a .zip or .csv file.")

        if not csv_file_path:
            raise FileNotFoundError("Could not find a CSV file to load.")

        print(f"Loading data from '{csv_file_path}' into table '{self.COMPANIES_TABLE_NAME}'...")
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
        print("Data loaded successfully.")
        self._create_fts_index()

    def _create_fts_index(self):
        """Creates a full-text search index on company name and number."""
        print(f"Creating FTS index on table '{self.COMPANIES_TABLE_NAME}'...")
        self.con.execute(f"""
            PRAGMA create_fts_index('{self.COMPANIES_TABLE_NAME}', 'company_number', 'company_name', overwrite=1);
        """
        )
        print("FTS index created successfully.")

    def _download_file(self, url: str, dest_path: Path):
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            total_size = int(r.headers.get("content-length", 0))
            with Progress("[progress.description]{task.description}", BarColumn(), DownloadColumn(),
                          TransferSpeedColumn(), "ETA:", TimeRemainingColumn()) as progress:
                task = progress.add_task(f"Downloading {dest_path.name}", total=total_size)
                with open(dest_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
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