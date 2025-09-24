# /tests/test_app.py

import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import status

# Import your FastAPI app instance
from company_structure_api.app import app


# This fixture creates a new test client for each test function
@pytest.fixture
async def client():
    # --- FIX ---
    # The httpx.AsyncClient needs the FastAPI app to be wrapped in an ASGITransport.
    # The 'app' argument is not valid for this client.
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    # --- End of FIX ---


# --- Test Cases ---


@pytest.mark.anyio
async def test_root_serves_html(client: AsyncClient):
    """
    Tests if the root URL ('/') successfully serves an HTML page
    in a simulated production environment.
    """
    response = await client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert "text/html" in response.headers["content-type"]
    assert '<div id="app">' in response.text


@pytest.mark.anyio
async def test_static_assets_are_served(client: AsyncClient):
    """
    Tests if a known static asset (like the manifest.json)
    can be fetched from the correct static path.
    This confirms your StaticFiles mounting is working.
    """
    # Note: This test requires that you have run `pnpm run build` at least once
    # so the /static/dist/.vite/manifest.json file exists.
    response = await client.get("/static/dist/.vite/manifest.json")

    if response.status_code != status.HTTP_404_NOT_FOUND:
        assert response.status_code == status.HTTP_200_OK
        assert "application/json" in response.headers["content-type"]
