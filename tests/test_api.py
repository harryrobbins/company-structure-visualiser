# backend/tests/test_api.py

import os
import pytest
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from fastapi import status

from api.dependencies import get_db
from companies_duck_house.core import CompaniesHouseDB
from config import settings

# Path to the sample data for testing
TESTS_DIR = Path(__file__).parent
SAMPLE_CSV = str(TESTS_DIR / "companies_house_sample_data.csv")
TEST_DB_FILE = settings.test_db_path
settings.OPENAI_API_KEY = "NONE"

@pytest.fixture(autouse=True)
def change_test_dir(request, monkeypatch):
    root_path = Path(request.fspath.dirname).resolve().parent
    monkeypatch.chdir(root_path)

# This fixture sets up a temporary database with sample data for API tests
@pytest.fixture(scope="module")
def test_db_manager():
    # Clean up any old test database file before starting
    db_path = Path(TEST_DB_FILE)
    db_path.parent.mkdir(exist_ok=True)
    if db_path.exists():
        os.remove(db_path)

    # Create a new database instance from the sample CSV
    db_manager = CompaniesHouseDB(db_path=str(db_path))
    with db_manager as ch_db:
        ch_db.create_database_from_source(source=SAMPLE_CSV)
        # Yield the manager to the tests INSIDE the context manager
        yield ch_db

    # Teardown: clean up the test database file after all tests in the module run
    if db_path.exists():
        os.remove(db_path)


# This fixture provides a test client with the database dependency overridden
@pytest.fixture
async def client(test_db_manager):
    # This is the key part for testing: we tell our FastAPI app
    # to use our temporary test database instead of the real one.
    from company_structure_api.app import app
    app.dependency_overrides[get_db] = lambda: test_db_manager

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # Clean up the override after the test is done
    app.dependency_overrides.clear()


# --- Test Cases for the New Endpoint ---

@pytest.mark.anyio
async def test_match_companies_success(client: AsyncClient, mocker):
    """
    Tests the /api/match-companies endpoint with a valid request.
    """
    mock_recommend = mocker.patch(
        "api.routers.companies.recommend_best_match",
        side_effect=["11743365", "SC606050"]
    )
    request_data = {"company_names": ["GRAPHICS", "INSPIRED INVESTMENTS"]}
    response = await client.post("/api/match-companies", json=request_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Check the response structure
    assert "matches" in data
    assert "GRAPHICS" in data["matches"]
    assert "INSPIRED INVESTMENTS" in data["matches"]

    # Check the content of the matches
    assert data["matches"]["GRAPHICS"]["recommended_match"]["CompanyName"] == "!BIG IMPACT GRAPHICS LIMITED"
    assert len(data["matches"]["GRAPHICS"]["other_matches"]) == 0

    assert data["matches"]["INSPIRED INVESTMENTS"]["recommended_match"]["CompanyName"] == "!NSPIRED INVESTMENTS LTD"
    assert len(data["matches"]["INSPIRED INVESTMENTS"]["other_matches"]) == 0
    
    assert mock_recommend.call_count == 2


@pytest.mark.anyio
async def test_match_companies_no_results(client: AsyncClient):
    """
    Tests the endpoint with a search term that should yield no results.
    """
    request_data = {"company_names": ["COMPANYTHATDOESNOTEXIST"]}
    response = await client.post("/api/match-companies", json=request_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "matches" in data
    assert "COMPANYTHATDOESNOTEXIST" in data["matches"]
    assert data["matches"]["COMPANYTHATDOESNOTEXIST"]["recommended_match"] is None
    assert len(data["matches"]["COMPANYTHATDOESNOTEXIST"]["other_matches"]) == 0


@pytest.mark.anyio
async def test_match_companies_validation_error(client: AsyncClient):
    """
    Tests that the endpoint returns a 422 Unprocessable Entity error
    for an invalid request payload (e.g., an empty list).
    """
    # An empty list should fail validation based on the Pydantic model
    request_data = {"company_names": []}
    response = await client.post("/api/match-companies", json=request_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    # A completely wrong structure should also fail
    wrong_request_data = {"names": ["some name"]} # 'names' is the wrong key
    response = await client.post("/api/match-companies", json=wrong_request_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
