#!/usr/bin/env bash
set -euo pipefail

DEST="${1:-static/libs}"
mkdir -p "$DEST"

# Pin versions for frontend libraries to ensure consistency.
VUE_VER="3.4.27"
PDFJS_VER="4.4.168"
DEXIE_VER="4.0.7"
TAILWIND_VER="3.4.3"


echo "Fetching Vue ${VUE_VER} (ESM browser build)..."
curl -fsSL "https://unpkg.com/vue@${VUE_VER}/dist/vue.esm-browser.prod.js" -o "${DEST}/vue.esm-browser.js"

echo "Fetching Dexie ${DEXIE_VER} (ESM)..."
curl -fsSL "https://unpkg.com/dexie@${DEXIE_VER}/dist/dexie.mjs" -o "${DEST}/dexie.mjs"

echo "Fetching PDF.js ${PDFJS_VER} (ESM + worker)..."
curl -fsSL "https://unpkg.com/pdfjs-dist@${PDFJS_VER}/build/pdf.mjs" -o "${DEST}/pdf.mjs"
curl -fsSL "https://unpkg.com/pdfjs-dist@${PDFJS_VER}/build/pdf.worker.mjs" -o "${DEST}/pdf.worker.mjs"

# Added Tailwind CSS fetch to resolve the 404 error.
# This fetches the standard Tailwind CDN build which works via a script tag.
echo "Fetching Tailwind CSS ${TAILWIND_VER}..."
curl -fsSL "https://cdn.tailwindcss.com@${TAILWIND_VER}" -o "${DEST}/tailwind.js"


echo "All done. Files saved to ${DEST}"

