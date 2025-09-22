#!/bin/bash
set -e
PORT=8050
echo "Starting FastAPI server with hot-reloading at http://localhost:$PORT"
uvicorn src.company_structure_api.app:app --host 0.0.0.0 --port $PORT --reload