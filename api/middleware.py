# api/middleware.py (Updated)
# Streamlined middleware for request ID and logging.

import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from .logging import set_request_id, get_logger

log = get_logger("middleware")


class RequestIdMiddleware(BaseHTTPMiddleware):
    """
    Attaches a unique X-Request-ID to every incoming request and outgoing response.
    It also logs the start and end of each request with timing information.
    Exception handling is now delegated to FastAPI's global exception handlers.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Use existing request ID or generate a new one.
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        set_request_id(request_id)

        start_time = time.perf_counter()

        log.info("Request started", extra={"method": request.method, "path": request.url.path})

        # Process the request. Exceptions will bubble up to be caught by global handlers.
        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000

        # Add request ID to the response headers.
        response.headers["x-request-id"] = request_id
        log.info(
            "Request finished",
            extra={"status_code": response.status_code, "duration_ms": int(duration_ms)}
        )

        return response
