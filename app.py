# app.py (Updated)
# Fixes routing order, static file mounting, and wires up a global exception handler.

import logging
import mimetypes
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

from api.router import router as api_router
from api.config import settings
from api.logging import configure_logging, get_logger, get_request_id
from api.middleware import RequestIdMiddleware
from api.errors import AppError

# --- App Lifecycle Events ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Configure logging on startup
    configure_logging(log_level=settings.LOG_LEVEL)
    logger = get_logger(__name__)
    logger.info("Application startup complete.", extra={"config": settings.model_dump(exclude={'OPENAI_API_KEY', 'AZURE_OPENAI_API_KEY'})})
    yield
    # Clean up resources on shutdown if needed
    get_logger(__name__).info("Application shutdown.")


# --- FastAPI App Initialization ---
app = FastAPI(
    title="PDF Text Extractor",
    description="An application to convert PDF pages to images and extract text using AI.",
    version="1.0.0",
    root_path=settings.ROOT_PATH,
    lifespan=lifespan
)


# --- Middleware Configuration ---
# RequestIdMiddleware must be first to ensure the ID is available for all other middleware and handlers.
app.add_middleware(RequestIdMiddleware)

# Add CORS middleware.
# In a production environment, you should restrict origins to your frontend's domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Or specify your frontend's origin e.g., ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-request-id"]
)


# --- Exception Handling ---
# This handler catches our custom AppError and formats it consistently.
@app.exception_handler(AppError)
async def app_error_exception_handler(request: Request, exc: AppError):
    logger = get_logger("exception_handler")
    logger.error("Application error occurred", extra={"code": exc.code, "detail": exc.message, "status": exc.status_code})
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "request_id": get_request_id()
            }
        },
    )

# This handler catches standard FastAPI HTTPExceptions.
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger = get_logger("exception_handler")
    logger.error(f"HTTP exception: {exc.detail}", extra={"status": exc.status_code})
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "http_exception",
                "message": exc.detail,
                "request_id": get_request_id()
            }
        },
    )

# A catch-all handler for any other unhandled exceptions.
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger = get_logger("exception_handler")
    logger.exception("An unhandled exception occurred")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "internal_server_error",
                "message": "An unexpected error occurred on the server.",
                "request_id": get_request_id()
            }
        },
    )


# --- Static Files and Templates Setup ---
# A single, correct static files mount.
# We ensure the .mjs MIME type is known for modern JavaScript modules.
mimetypes.add_type("application/javascript", ".mjs")
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")
# Use custom delimiters to avoid conflicts with Vue.js syntax.
templates.env.variable_start_string = "[["
templates.env.variable_end_string = "]]"


# --- API and Application Routes ---
# API routes are included first.
app.include_router(api_router)

# The /health endpoint is now correctly placed before the catch-all route.
@app.get("/health", tags=["Monitoring"])
async def health_check():
    """A simple health check endpoint for monitoring."""
    return {"status": "ok"}

# The catch-all route for the Single Page Application (SPA).
# This MUST be the LAST route defined to avoid shadowing other specific routes.
@app.get("/{full_path:path}", response_class=HTMLResponse, include_in_schema=False)
async def read_index(request: Request):
    """Serves the main index.html file for any non-API path."""
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "root_url": settings.ROOT_PATH
        }
    )
