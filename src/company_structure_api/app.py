from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request
from starlette.responses import HTMLResponse
from starlette.templating import Jinja2Templates
from starlette.types import Scope

from company_structure_api.companies_api_router import router as companies_api_router
from company_structure_api.company_visualizer import CompanyVisualizer
from company_structure_api.db import initialize_database
from company_structure_api.config import Settings
from company_structure_api.swagger import router as swagger_router

@asynccontextmanager
async def lifespan(lifespan_app: FastAPI):
    config = Settings()
    db = await initialize_database(config)
    with CompanyVisualizer(config, db) as company_visualizer:
        lifespan_app.state.company_visualizer = company_visualizer
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

app.include_router(companies_api_router)
app.mount("/", SPAStaticFiles(directory=Path(__file__).parent.parent.parent / "static"), name="static")