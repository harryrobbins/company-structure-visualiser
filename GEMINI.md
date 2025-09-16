# GEMINI.md: AI-Oriented Project Analysis

This document provides a technical overview of the Company Structure Visualizer project, intended for consumption by AI models for analysis, debugging, and understanding the system architecture.

## 1. Project Objective

The primary goal of this application is to parse an XLSX file containing company and ownership data and render it as an interactive, client-side graph. The system is designed with a distinct separation between a modern JavaScript frontend and a Python backend, optimized for both a rapid development workflow and a standard production deployment.

## 2. Core Technologies

-   **Frontend**: Vue.js 3, Vite, Tailwind CSS, Vue Flow, Dexie.js (for IndexedDB)
-   **Backend**: FastAPI (Python), Uvicorn, Jinja2
-   **Package Manager**: pnpm

## 3. System Architecture

The application employs a decoupled two-part architecture: a static frontend that handles all user interaction and business logic, and a lightweight backend responsible only for serving the compiled frontend in a production environment.

### 3.1. Frontend (`/frontend`)

The frontend is a Single Page Application (SPA) responsible for:
1.  **User Interface**: Rendering the file upload button, headers, and the graph canvas.
2.  **File Processing**: Using the `xlsx` library (via dynamic `import()`) to parse the uploaded spreadsheet directly in the browser. This avoids backend file handling.
3.  **Data Persistence**: Using `Dexie.js` to store the parsed company and ownership data in the user's browser (IndexedDB) in a relational format (`spreadsheets`, `companies`, `ownership` tables).
4.  **Visualization**: Transforming the relational data into a node-edge format compatible with the `Vue Flow` library and rendering the interactive graph.

### 3.2. Backend (`/app.py`)

The backend is a minimal FastAPI application with a single primary role: **to serve the production-ready frontend**. It does not handle any of the core business logic (like parsing files). Its key functions are:
1.  **Static File Serving**: Mounting the `/static` directory to serve compiled JavaScript, CSS, and other assets.
2.  **Dynamic HTML Rendering**: Using a Jinja2 template to render the main `index.html`, dynamically injecting the correct paths to the version-hashed JS and CSS files by reading a Vite-generated `manifest.json`.

---

## 4. Workflow Analysis

### 4.1. Development Workflow

The development environment is optimized for productivity using Vite's capabilities.

1.  **Two-Server Process**:
    -   The **FastAPI server** is run via `uvicorn app:app --reload`. Its role is minimal, mostly for future API endpoints.
    -   The **Vite dev server** is run via `pnpm run dev` from the `/frontend` directory. This is the primary server the developer interacts with.
2.  **Vite's Role**:
    -   It serves the application from memory, providing near-instant Hot Module Replacement (HMR).
    -   It handles all CSS pre-processing (via PostCSS and Tailwind) on the fly.
    -   The `vite.config.js` is configured with `base: '/'` in this mode, so all asset paths are root-relative and work correctly.

### 4.2. Production Build and Serve Workflow

This workflow generates a set of optimized, static files for deployment.

1.  **Build Command**: `pnpm run build` is executed from the `/frontend` directory.
2.  **Vite Build Process**:
    -   The `vite.config.js` sets `base: '/static/dist/'`. This prepends all asset URLs in the final HTML with the correct path for FastAPI.
    -   Vite compiles, bundles, and minifies all Vue/JS/CSS source files.
    -   The output is placed in `/static/dist/`. The `emptyOutDir: true` option ensures a clean build directory.
    -   Crucially, it generates a `.vite/manifest.json` file, which maps original filenames to their final, content-hashed output filenames (e.g., `main.js` -> `assets/index-cW5C_ezi.js`).
3.  **Post-Build Script**: The `&& mv ../static/dist/index.html ../templates/index.html` command in `package.json` moves the generated HTML file into the `/templates` directory, making it a Jinja2 template.
4.  **FastAPI Serving Process**:
    -   When a user requests the root URL (`/`), the `@app.get("/")` endpoint in `app.py` is triggered.
    -   The `get_vite_assets` function reads `/static/dist/.vite/manifest.json`.
    -   It extracts the paths for all necessary JavaScript and CSS files.
    -   It passes these file paths as lists (`js_paths`, `css_paths`) to the Jinja2 template.
    -   Jinja2 renders `templates/index.html`, iterating through the lists to inject the correct `<script>` and `<link>` tags with the versioned asset paths. This ensures the browser never serves a stale cached version of the assets.

## 5. Key Configuration Files Analysis

-   **`frontend/vite.config.js`**: The most critical file for bridging dev and prod. It uses a function `defineConfig(({ command }) => ...)` to conditionally set the `base` path, which is the key to making both environments work.
-   **`frontend/tailwind.config.js`**: Defines which files (`.vue`, `.js`, `.html`) Tailwind should scan to generate the required CSS utility classes.
-   **`frontend/postcss.config.js`**: Integrates Tailwind CSS into the Vite build pipeline by registering it as a PostCSS plugin.
-   **`frontend/package.json`**:
    -   Contains the `build` script which chains the Vite build and the subsequent `mv` command.
    -   The `"type": "module"` entry is important for ensuring Node.js correctly interprets the modern ES Module syntax used in the configuration files.
-   **`app.py`**: Configures Jinja2 to use `[[...]]` delimiters to avoid conflicts with Vue's `{{...}}` syntax. It contains the logic to read the Vite manifest and serve the application.

## 6. Data Flow Summary

1.  **Upload**: User selects an XLSX file.
2.  **Parse**: `handleFileUpload` in `App.vue` triggers a dynamic `import('xlsx')`. The file is read as an ArrayBuffer.
3.  **Process**: `read` and `sheet_to_json` from the `xlsx` library convert the sheets into JSON arrays. Data is trimmed to prevent whitespace issues.
4.  **Persist**: The JSON data is saved into IndexedDB using Dexie in a relational schema (one `spreadsheets` record, multiple `companies` and `ownership` records).
5.  **Transform**: Data is retrieved from Dexie. The `companies` are mapped to Vue Flow `nodes`, and the `ownership` data is mapped to `edges`. Unique UUIDs generated during the persistence step are used as node IDs to ensure graph integrity.
6.  **Render**: The `nodes` and `edges` reactive variables are updated, causing Vue Flow to render the interactive graph.