# app.py

import logging
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Imports are now simpler, pointing directly to the unified 'api' module.
from api.router import router as api_router
from api.config import settings
import logging
from api.logging import configure_logging, get_logger

from starlette.middleware import Middleware
from api.middleware import RequestIdMiddleware

configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title="PDF Text Extractor",
    description="An application to convert PDF pages to images and extract text using AI.",
    version="1.0.0",
    root_path=settings.ROOT_PATH,
    middleware=[
        Middleware(RequestIdMiddleware),
    ]
)

# Add the middleware **before** mounting routes
logger.info(f"FastAPI application initialized with root_path: '{settings.ROOT_PATH}'")

# --- Static Files and Templates Setup ---
app.mount("/static", StaticFiles(directory="static"), name="static")
logger.info("Mounted static files directory at '/static'.")

templates = Jinja2Templates(directory="templates")
templates.env.variable_start_string = "[["
templates.env.variable_end_string = "]]"
logger.info("Jinja2 templates configured with custom delimiters [[ ... ]].")


# --- API Router Integration ---
app.include_router(api_router)
logger.info("Included API router from 'api' module.")

# Mount the 'static' directory to serve frontend assets like JS, CSS, and libraries.
# The path is relative to the project root where the app is run.
# Create a custom StaticFiles class that knows about .mjs files
class CustomStaticFiles(StaticFiles):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add .mjs to the media types
        import mimetypes
        mimetypes.add_type('application/javascript', '.mjs', True)
import mimetypes
mimetypes.add_type('application/javascript', '.mjs', True)
app.mount(
    "/static",
    CustomStaticFiles(directory="static"),
    name="static"
)
logger.info("Mounted static files directory at '/static'.")

# --- Core Application Route ---
@app.get("/{full_path:path}", response_class=HTMLResponse)
async def read_index(request: Request):
    """
    Serves the main index.html file for any non-API path.
    """
    logger.info(f"Serving index.html for path: '{request.url.path}'")
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "root_url": settings.ROOT_PATH
        }
    )

@app.get("/health")
async def health_check():
    """
    A simple health check endpoint for monitoring.
    """
    return {"status": "ok"}
