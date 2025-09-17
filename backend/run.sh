#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e


# --- Application Execution ---

# Start the FastAPI server using Uvicorn.
# --host 0.0.0.0: Makes the server accessible on your network.
# --port 8000: Specifies the port to run on.
# --reload: Enables hot reloading. The server will restart automatically when you change backend Python files.
PORT=8050
echo "Starting FastAPI server with hot-reloading at http://localhost:$PORT"
uvicorn src.app:app --host 0.0.0.0 --port $PORT --reload

