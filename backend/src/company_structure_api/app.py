# app.py
import json
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.dependencies import initialize_database
from api.routers.companies import router as companies_api_router
from api.routers.llm import router as llm_api_router
from companies_duck_house.core import CompaniesHouseDB
from config import settings

class SPAStaticFiles(StaticFiles):
    # Override the get_response method, which is responsible for retrieving
    # static file responses for given paths.
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except (HTTPException, StarletteHTTPException) as ex:
            if ex.status_code == 404:
                return await super().get_response("index.html", scope)
            else:
                raise ex

def run_startup_logic():
    initialize_database()

    Path(settings.db_dir).mkdir(exist_ok=True)

    db = CompaniesHouseDB(db_path=settings.db_path)

    with db:
        if settings.force_recreate_db or not db.table_exists("companies"):
            if settings.force_recreate_db:
                print("`force_recreate_db` is true, rebuilding database...")
            else:
                print(f"Table 'companies' not found in {settings.db_path}, creating it...")
            db.create_database_from_source(source=settings.data_source)
        else:
            print(f"Table 'companies' already exists in {settings.db_path}, skipping creation.")

@asynccontextmanager
async def lifespan(app2: FastAPI):
    print("Running startup logic...")
    await asyncio.to_thread(run_startup_logic)
    app.mount("/", SPAStaticFiles(directory="static", html = True))

    print("Startup logic complete.")
    yield

app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None)
app.include_router(llm_api_router)
app.include_router(companies_api_router)