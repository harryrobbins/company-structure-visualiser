import uvicorn
import os

def main():
    port = int(os.environ.get('PORT', "8050"))
    uvicorn.run("company_structure_api.app:app", host="0.0.0.0", port=port, reload=True)