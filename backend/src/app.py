# app.py
import json
import jinja2
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Import the new router
from src.api.routers.companies import router as companies_api_router
from src.api.routers.llm import router as llm_api_router
from src.companies_duck_house.core import CompaniesHouseDB
from src.config import settings
import os


app = FastAPI()

@app.on_event("startup")
def startup_event():
    data_dir = Path(settings.data_dir)
    data_dir.mkdir(exist_ok=True)

    db = CompaniesHouseDB(db_path=settings.db_path)
    db.connect()
    db.create_database_from_source(source=settings.data_source)
    db.disconnect()

# --- FIX ---
# The Jinja2Templates class from FastAPI/Starlette does not accept a pre-built 'env' object.
# Instead, you pass the configuration arguments for the Jinja2 Environment directly to its constructor.
# It will automatically create the FileSystemLoader with the provided directory.
templates = Jinja2Templates(
    directory="templates",
    variable_start_string="[[",
    variable_end_string="]]",
)
# --- End of FIX ---


# Mount the 'static' directory to serve files like JS, CSS, and images
app.mount("/static", StaticFiles(directory="static"), name="static")

# Path to the Vite manifest file. Adjusted path to match your tree.
VITE_MANIFEST_PATH = Path("static/assets/dist/.vite/manifest.json")


def get_vite_assets(request: Request):
    """
    Reads the Vite manifest file and returns lists of paths for the JS and CSS files.
    This handles cases where Vite splits code into multiple chunks.
    """
    if not VITE_MANIFEST_PATH.exists():
        return {}

    with open(VITE_MANIFEST_PATH) as f:
        manifest = json.load(f)

    # Use the correct entry point from your project structure
    main_js_entry = manifest.get("index.html", {})
    if not main_js_entry:
        main_js_entry = manifest.get("src/main.js", {})  # Fallback for older builds

    base_url = str(request.base_url)

    # Handle both direct file and nested 'file' keys
    js_files = [main_js_entry.get("file")] if main_js_entry.get("file") else []

    # Handle CSS files associated with the entry point
    css_files = main_js_entry.get("css", [])

    # Ensure all imported modules' CSS is also included
    if "imports" in main_js_entry:
        for imp in main_js_entry["imports"]:
            if manifest[imp].get("css"):
                css_files.extend(manifest[imp]["css"])

    # Get all JS files, including dynamic imports (chunks)
    all_js_files = set(js_files)
    if "dynamicImports" in main_js_entry:
        for dynamic_import in main_js_entry["dynamicImports"]:
            chunk = manifest.get(dynamic_import, {})
            if chunk.get("file"):
                all_js_files.add(chunk["file"])

    # The main entry file is often imported by the HTML entry, ensure it's included
    if main_js_entry.get("imports"):
        for imp_key in main_js_entry.get("imports"):
            imp_entry = manifest.get(imp_key, {})
            if imp_entry.get("file"):
                all_js_files.add(imp_entry["file"])

    # Use the correct asset path from your build output
    asset_base_path = f"{base_url}static/assets/dist/"

    return {
        "js_paths": [f"{asset_base_path}{js}" for js in all_js_files if js],
        "css_paths": list(set([f"{asset_base_path}{css}" for css in css_files if css])),
    }


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """
    Serves the main Vue application.
    """
    vite_assets = get_vite_assets(request)
    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "js_paths": vite_assets.get("js_paths", []),
            "css_paths": vite_assets.get("css_paths", []),
        },
    )


# Include your API routers
app.include_router(llm_api_router)
app.include_router(companies_api_router)
