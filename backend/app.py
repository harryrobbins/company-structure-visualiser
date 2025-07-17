# backend/app.py

import os
import logging
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from backend.api.analyze import router as analyze_router
from backend.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FastAPI Application Setup ---

# Initialize the FastAPI application
app = FastAPI(
    title="AIGENT",
    description="A self-contained web application for running AI-powered agents.",
    version="1.0.0",
)

logger.info("FastAPI application initialized.")

# --- Static Files and Templates ---

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
    CustomStaticFiles(directory="frontend/static"),
    name="static"
)
logger.info("Mounted static files directory at '/static'.")


# Configure Jinja2 for templating.
# The directory points to where the HTML templates are stored.
templates = Jinja2Templates(directory="backend/templates")

# IMPORTANT: Change Jinja2 delimiters to avoid conflicts with Vue.js syntax.
# Vue.js uses {{ }} by default, so we'll use [[ ]] for Jinja2.
templates.env.variable_start_string = "[["
templates.env.variable_end_string = "]]"
logger.info("Jinja2 templates configured with custom delimiters [[ ... ]].")


# --- API Routers ---

# Include the router from the 'analyze' API module.
# All routes defined in that router will be added to the application.
app.include_router(analyze_router)
logger.info("Included API router from 'analyze' module.")


# --- Core Application Routes ---

@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request) -> HTMLResponse:
    """
    Serves the main index.html file.

    This is the entry point for the Vue.js single-page application.
    It passes the ROOT_URL from settings to the template, which allows
    the frontend to correctly construct URLs for static assets and API calls,
    even if the app is hosted under a sub-path.

    Args:
        request (Request): The incoming request object from FastAPI.

    Returns:
        HTMLResponse: The rendered index.html template.
    """
    logger.info("Serving index.html.")
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "root_url": settings.ROOT_URL
        }
    )

@app.get("/health")
async def health_check() -> dict:
    """
    A simple health check endpoint.

    Returns a 200 OK response with a status message, which can be used by
    monitoring services to verify that the application is running.
    """
    return {"status": "ok"}

