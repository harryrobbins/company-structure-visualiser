# api/errors.py
from __future__ import annotations
from typing import Any, Dict, Optional
from fastapi import HTTPException

class AppError(HTTPException):
    """Typed application error with a machine-readable code."""
    def __init__(self, status_code: int, code: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=status_code, detail={"code": code, "message": message, "details": details or {}})
        self.code = code
        self.message = message
        self.details = details or {}