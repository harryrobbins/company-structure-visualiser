import urllib.parse
from fastapi import APIRouter, Request
from fastapi.openapi.docs import get_swagger_ui_html

router = APIRouter(include_in_schema=False)


@router.get("/docs", include_in_schema=False)
async def relocatable_swagger_ui(request: Request):
    base_url = str(request.url_for(relocatable_swagger_ui.__name__)).removesuffix(
        "docs"
    )
    # swagger assets are copied into the static/ dir by the ui build
    return get_swagger_ui_html(
        openapi_url=urllib.parse.urljoin(base_url, "openapi.json"),
        title="Company structure visualizer - Swagger UI",
        swagger_js_url=urllib.parse.urljoin(base_url, "swagger/swagger-ui-bundle.js"),
        swagger_css_url=urllib.parse.urljoin(base_url, "swagger/swagger-ui.css"),
        swagger_ui_parameters={
            "persistAuthorization": True,
        },
        swagger_favicon_url=urllib.parse.urljoin(
            base_url, "rebrand/images/favicon.ico"
        ),
    )
