# api/middleware.py
from __future__ import annotations
import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from .logging import set_request_id, get_logger, get_request_id

log = get_logger("middleware")

class RequestIdMiddleware(BaseHTTPMiddleware):
    """Attach/propagate X-Request-ID and log request/response."""
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable):
        rid = request.headers.get("x-request-id") or str(uuid.uuid4())
        set_request_id(rid)
        start = time.perf_counter()
        log.info("request.start", extra={
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host if request.client else None,
        })
        try:
            response: Response = await call_next(request)
        except Exception as exc:
            # Ensure we always log and return a 500 with ID
            log.exception("request.exception", extra={"path": request.url.path})
            from fastapi.responses import JSONResponse
            response = JSONResponse(status_code=500, content={
                "error": {"code": "internal_error", "message": "Unexpected server error", "request_id": rid}
            })
        finally:
            duration_ms = int((time.perf_counter() - start) * 1000)
            log.info("request.stop", extra={"status": response.status_code, "duration_ms": duration_ms})
            response.headers["x-request-id"] = rid
        return response