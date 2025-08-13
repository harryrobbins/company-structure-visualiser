# api/logging.py
from __future__ import annotations
import json
import logging
import os
import sys
import time
import uuid
from typing import Any, Dict
from contextvars import ContextVar

# Correlation ID stored per-request
_request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)

def get_request_id() -> str | None:
    return _request_id_ctx.get()

def set_request_id(value: str | None) -> None:
    _request_id_ctx.set(value)

class JsonFormatter(logging.Formatter):
    """A minimal JSON formatter for logs."""
    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "ts": self.formatTime(record, datefmt="%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        rid = get_request_id()
        if rid:
            payload["request_id"] = rid
        # Include extras if present
        for key, value in record.__dict__.items():
            if key not in ("args", "asctime", "created", "exc_info", "exc_text", "filename",
                           "funcName", "levelname", "levelno", "lineno", "module", "msecs",
                           "msg", "name", "pathname", "process", "processName", "relativeCreated",
                           "stack_info", "thread", "threadName"):
                payload[key] = value
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)

class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        rid = get_request_id()
        if rid:
            record.request_id = rid
        return True

_DEF_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

def configure_logging(app_name: str = "pdf-text-extractor") -> None:
    """Configure root logger for JSON output to stdout."""
    root = logging.getLogger()
    root.setLevel(_DEF_LEVEL)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    handler.addFilter(RequestIdFilter())

    # Clear existing handlers to avoid duplicates in reloads
    root.handlers.clear()
    root.addHandler(handler)

    # Silence overly chatty loggers (tune as needed)
    for noisy in ("uvicorn.error", "uvicorn.access", "asyncio", "httpx"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.getLogger(app_name).info("logging configured", extra={"app": app_name, "level": _DEF_LEVEL})


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)