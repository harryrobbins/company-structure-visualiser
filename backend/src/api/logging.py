# api/logging.py (Updated)
# Centralized, structured JSON logging configuration.

from __future__ import annotations
import json
import logging
import sys
from contextvars import ContextVar

# Context variable to hold the request ID for correlation.
_request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)


def get_request_id() -> str | None:
    """Retrieves the current request ID from the context."""
    return _request_id_ctx.get()


def set_request_id(value: str | None) -> None:
    """Sets the request ID in the context for the current request."""
    _request_id_ctx.set(value)


class JsonFormatter(logging.Formatter):
    """
    Formats log records as a single line of JSON.
    This is ideal for structured logging and easy parsing by log management systems.
    """

    def format(self, record: logging.LogRecord) -> str:
        # Base payload for every log entry.
        payload = {
            "ts": self.formatTime(record, datefmt="%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        # Add request ID if available in the context.
        if rid := get_request_id():
            payload["request_id"] = rid

        # Add any extra fields passed to the logger.
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        # Merge extra dictionary if it exists
        if hasattr(record, 'extra_dict'):
            payload.update(record.extra_dict)

        return json.dumps(payload, ensure_ascii=False)


def configure_logging(log_level: str = "INFO") -> None:
    """
    Configures the root logger for the application.
    This should be called once on application startup.
    It removes all existing handlers and sets up a new one for JSON output to stdout.
    """
    root_logger = logging.getLogger()
    # If handlers are already present, it means logging was configured.
    if root_logger.handlers:
        return

    root_logger.setLevel(log_level.upper())

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root_logger.handlers.clear()
    root_logger.addHandler(handler)

    # Silence overly verbose loggers from libraries.
    for noisy_logger in ("uvicorn.error", "uvicorn.access", "httpx"):
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)

    logging.getLogger("logging_config").info(f"Logging configured at level {log_level.upper()}.")


def get_logger(name: str) -> logging.Logger:
    """A convenience function to get a logger instance."""
    return logging.getLogger(name)
