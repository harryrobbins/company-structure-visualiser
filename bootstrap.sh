#!/usr/bin/env bash

# Create backend directory structure
mkdir -p backend/api backend/core backend/templates

# Create frontend directory structure
mkdir -p frontend/static/css frontend/static/js frontend/static/libs

# Create root-level project files
touch requirements.txt README.md docker-compose.yml

# Create backend files
mkdir -p backend/api backend/core backend/templates

touch backend/app.py \
      backend/api/analyze.py \
      backend/core/config.py \
      backend/core/llm_client.py \
      backend/templates/index.html

# Create frontend files
mkdir -p frontend

touch frontend/index.html \
      frontend/static/css/tailwind.js \
      frontend/static/js/main.js \
      frontend/static/js/agents.js \
      frontend/static/js/sets.js \
      frontend/static/js/docs.js \
      frontend/static/js/results.js \
      frontend/static/libs/pdf.js \
      frontend/static/libs/xlsx.js \
      frontend/static/libs/docx.js \
      frontend/static/libs/showdown.js
