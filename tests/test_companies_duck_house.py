import os
import pytest
from pathlib import Path
from companies_duck_house.core import CompaniesHouseDB
from companies_duck_house.models import Company

TEST_DB = "test_companies.duckdb"
LIVE_TEST_DB = "live_test_companies.duckdb"

# Construct an absolute path to the CSV file to ensure tests run from any directory
TESTS_DIR = Path(__file__).parent
SAMPLE_CSV = str(TESTS_DIR / "companies_house_sample_data.csv")

# URL for the live data test
COMPANY_DATA_URL = os.environ.get(
    "COMPANY_DATA_URL",
    "https://download.companieshouse.gov.uk/BasicCompanyDataAsOneFile-2025-09-01.zip"
)


@pytest.fixture
def db_manager():
    """Pytest fixture to set up and tear down the database for each test."""
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

    yield CompaniesHouseDB(db_path=TEST_DB)

    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)


def test_create_database_from_csv(db_manager):
    """Tests if the database and table are created successfully."""
    with db_manager as ch_db:
        ch_db.create_database_from_source(source=SAMPLE_CSV)

        tables = ch_db.con.execute("SHOW TABLES").fetchall()
        table_names = [table[0] for table in tables]
        assert ch_db.COMPANIES_TABLE_NAME in table_names

        result = ch_db.con.execute(f"SELECT COUNT(*) FROM {ch_db.COMPANIES_TABLE_NAME}").fetchone()
        assert result is not None
        assert result[0] == 19


def test_search_companies_by_name(db_manager):
    """Tests the FTS search by name functionality."""
    with db_manager as ch_db:
        ch_db.create_database_from_source(source=SAMPLE_CSV)

        # Scenario 1: Successful search
        search_results = ch_db.search_companies_by_name("GRAPHICS")
        assert len(search_results) == 1
        assert isinstance(search_results[0], Company)
        assert search_results[0].company_name == '!BIG IMPACT GRAPHICS LIMITED'

        # Scenario 2: No results
        no_results = ch_db.search_companies_by_name("NONEXISTENTCOMPANY")
        assert len(no_results) == 0

def test_search_companies_by_escaped_name(db_manager):
    """Tests the FTS search by name functionality."""
    with db_manager as ch_db:
        ch_db.create_database_from_source(source=SAMPLE_CSV)

        search_results = ch_db.search_companies_by_name('TRIPLE')
        assert len(search_results) == 1
        assert isinstance(search_results[0], Company)
        assert search_results[0].company_name == '" TRIPLE D" PROPERTIES LIMITED'


def test_get_company_by_number(db_manager):
    """Tests retrieving a company by its exact number."""
    with db_manager as ch_db:
        ch_db.create_database_from_source(source=SAMPLE_CSV)

        # Scenario 1: Successful lookup
        company = ch_db.get_company_by_number("SC606050")
        assert company is not None
        assert isinstance(company, Company)
        assert company.company_name == '!NSPIRED INVESTMENTS LTD'

        # Scenario 2: No result for a non-existent number
        no_result = ch_db.get_company_by_number("DOESNOTEXIST")
        assert no_result is None




@pytest.mark.manual
def test_create_database_from_live_url():
    """
    Tests creating the database from the live Companies House URL.
    This is a long-running test and requires an internet connection.
    It is marked as 'manual' and can be run explicitly with `pytest -m manual`.
    """
    if os.path.exists(LIVE_TEST_DB):
        os.remove(LIVE_TEST_DB)

    db_manager = CompaniesHouseDB(db_path=LIVE_TEST_DB)
    with db_manager as ch_db:
        ch_db.create_database_from_source(source=COMPANY_DATA_URL)

        tables = ch_db.con.execute("SHOW TABLES").fetchall()
        table_names = [table[0] for table in tables]
        assert ch_db.COMPANIES_TABLE_NAME in table_names

        result = ch_db.con.execute(f"SELECT COUNT(*) FROM {ch_db.COMPANIES_TABLE_NAME}").fetchone()
        assert result is not None
        # The real dataset has millions of rows
        assert result[0] > 1000000, "Live data should have millions of companies."

    if os.path.exists(LIVE_TEST_DB):
        os.remove(LIVE_TEST_DB)

