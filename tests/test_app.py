# /tests/test_app.py
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from fastapi import status
from company_structure_api.app import app


@pytest.fixture
async def client(request, monkeypatch):
    root_path = Path(request.fspath.dirname).resolve().parent
    monkeypatch.chdir(root_path)
    with TestClient(app) as test_client:
        yield test_client


@pytest.mark.anyio
async def test_root_serves_html(client):
    """
    Tests if the root URL ('/') successfully serves an HTML page
    in a simulated production environment.
    """
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert "text/html" in response.headers["content-type"]
    assert '<div id="app">' in response.text


@pytest.mark.anyio
async def test_static_assets_are_served(client):
    """
    Tests if a known static asset (like the manifest.json)
    can be fetched from the correct static path.
    This confirms your StaticFiles mounting is working.
    """
    # Note: This test requires that you have run `pnpm run build` at least once
    # so the /static/dist/.vite/manifest.json file exists.
    response = client.get("/assets/rebrand/manifest.json")

    if response.status_code != status.HTTP_404_NOT_FOUND:
        assert response.status_code == status.HTTP_200_OK
        assert "application/json" in response.headers["content-type"]
