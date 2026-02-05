import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request
from starlette.responses import HTMLResponse
from starlette.templating import Jinja2Templates
from starlette.types import Scope

from api.dependencies import initialize_database
from api.routers.companies import router as companies_api_router
from api.routers.llm import router as llm_api_router
from companies_duck_house.core import CompaniesHouseDB
from config import settings
from company_structure_api.swagger import router as swagger_router

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

app = FastAPI(title="Company structure visualizer", docs_url=None, redoc_url=None, lifespan=lifespan)
app.include_router(swagger_router)

templates = Jinja2Templates(directory=Path(__file__).parent.parent.parent / "templates")
templates.env.variable_start_string = "[["
templates.env.variable_end_string = "]]"

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def home(request: Request) -> HTMLResponse:
    base_path = request.url_for(home.__name__).path
    return templates.TemplateResponse(
        request=request, name="index.html", context={"base_path": base_path}
    )

class SPAStaticFiles(StaticFiles):
    # Override the get_response method, which is responsible for retrieving
    # static file responses for given paths.
    async def get_response(self, path: str, scope: Scope):
        try:
            return await super().get_response(path, scope)
        except (HTTPException, StarletteHTTPException) as ex:
            if ex.status_code == 404:
                return await home(Request(scope))
            else:
                raise ex

app.include_router(llm_api_router)
app.include_router(companies_api_router)
app.mount("/", SPAStaticFiles(directory=Path(__file__).parent.parent.parent / "static"), name="static")