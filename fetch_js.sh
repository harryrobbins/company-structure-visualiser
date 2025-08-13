#!/usr/bin/env bash
set -euo pipefail

DEST="${1:-static/libs}"
mkdir -p "$DEST"

# Pin versions you’re comfortable with (edit as needed)
VUE_VER="3.5.18"
PDFJS_VER="5.4.54"
DEXIE_VER="4.0.11"


echo "Fetching Vue ${VUE_VER} (ESM browser build)…"
curl -fsSL "https://unpkg.com/vue@${VUE_VER}/dist/vue.esm-browser.js" -o "${DEST}/vue.esm-browser.js"

echo "Fetching Dexie ${DEXIE_VER} (ESM)…"
curl -fsSL "https://unpkg.com/dexie@${DEXIE_VER}/dist/dexie.mjs" -o "${DEST}/dexie.mjs"

echo "Fetching PDF.js ${PDFJS_VER} (ESM + worker)…"
curl -fsSL "https://unpkg.com/pdfjs-dist@${PDFJS_VER}/build/pdf.mjs" -o "${DEST}/pdf.mjs"
curl -fsSL "https://unpkg.com/pdfjs-dist@${PDFJS_VER}/build/pdf.worker.mjs" -o "${DEST}/pdf.worker.mjs"

echo "All done. Files saved to ${DEST}"
