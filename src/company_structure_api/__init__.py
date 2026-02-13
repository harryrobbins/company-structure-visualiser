import logging
import sys
import uvicorn
import os

def configure_logging():
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    root.addHandler(handler)

    # suppress uvicorn access logs so we can roll our own
    uvicorn_logger = logging.getLogger("uvicorn.access")
    uvicorn_logger.setLevel(logging.ERROR)

configure_logging()

def main():
    port = int(os.environ.get('PORT', "8050"))
    uvicorn.run("company_structure_api.app:app", host="0.0.0.0", port=port, reload=True)
