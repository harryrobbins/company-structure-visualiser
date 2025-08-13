# Architecture Decision Records

This document captures key design decisions for the project. Each ADR follows the format: **Status**, **Context**, **Decision**, **Rationale**, **Consequences**, **Alternatives Considered**, **Operational Notes**, and **Related Decisions**.

---

## ADR-001: Favor Client-Side Processing Where Possible

**Status:** Accepted (2025-08-13)

### Context

The application converts PDF pages to images and extracts text using an LLM. Running as a FastAPI app, the frontend is capable of significant work in the browser thanks to modern APIs (Canvas, Web Workers, IndexedDB) and libraries (PDF.js, Dexie). The deployment environment may operate with limited or no internet connectivity.

### Decision

Perform all non-sensitive, CPU-bound, and user-specific transformations **in the browser**:

* **PDF rendering**: Use PDF.js to render pages to canvases and produce PNG data URLs.
* **Local persistence**: Store PDFs and extracted text in IndexedDB via Dexie (ESM), enabling offline resilience and fast reloads.
* **UX state & composition**: Use Vue 3 Composition API to orchestrate state transitions (loading, progress, error handling) entirely on the client.
* **Network calls**: Restrict server calls to LLM-backed text extraction and other operations that require server credentials or compute.

### Rationale

* **Performance/latency**: Immediate feedback for rendering and preview; avoids server round-trips for large PDFs.
* **Scalability**: Moves hot paths to the edge (the browser), reducing server load and simplifying horizontal scaling.
* **Privacy**: Keeps user files local until an explicit extraction request is sent.
* **Offline-friendly**: Local state and rendering continue working when the network is intermittent.

### Consequences

* **Pros**: Lower backend costs, better perceived performance, simpler backend API surface.
* **Cons**: Browser memory/CPU limits may constrain extremely large PDFs; must manage compatibility (worker paths, memory pressure).

### Alternatives Considered

1. **Server-side rendering** (e.g., Ghostscript/Poppler): Centralized control but higher infra cost and latency; less privacy.
2. **Hybrid streaming** (server renders thumbnails, client renders full): Added complexity for marginal UX gains in this use case.

### Operational Notes

* Ensure `pdf.worker.mjs` is locally served and `GlobalWorkerOptions.workerSrc` is set to a local URL.
* Consider incremental rendering for very large PDFs (render N pages ahead).

### Related Decisions

* ADR-003 (ESM + import maps) for module delivery in a no-bundler environment.

---

## ADR-002: Python Service Structure (FastAPI + Settings + LLM Client)

**Status:** Accepted (2025-08-13)

### Context

We need a minimal, maintainable backend to expose a small API surface for AI extraction and to serve static assets. The app must be configurable for OpenAI or Azure OpenAI deployments and allow subpath mounting.

### Decision

Adopt a layered, explicit Python structure:

* **FastAPI app (`app.py`)**: Mounts static files, configures Jinja2 templates with `[[ ... ]]` delimiters, includes API router, and supports configurable `ROOT_PATH`.
* **Configuration (`api/config.py`)**: Centralize env-driven settings via `pydantic-settings` with typed fields for provider selection and credentials.
* **LLM client factory (`api/llm_client.py`)**: Late-bind to OpenAI or Azure OpenAI async clients based on config; surface the chosen model/deployment.
* **LLM interface (`api/llm_interface.py`)**: Provide a single async function (`extract_text_from_image`) wrapping chat/completions; isolate prompt content.
* **Prompts (`api/prompts.py`)**: Store prompt templates centrally for testability and reuse.
* **Router (`api/router.py`)**: Validate inputs/outputs with Pydantic models; convert exceptions to typed HTTP errors.

### Rationale

* **Separation of concerns**: Clear boundaries keep tests focused and failures easier to diagnose.
* **Config safety**: Typed settings reduce misconfiguration; `.env`-driven deployment is portable.
* **Async readiness**: Async clients and handlers avoid blocking during concurrent extraction requests.

### Consequences

* **Pros**: Clean extensibility (swap providers, add endpoints), strong configuration hygiene.
* **Cons**: Slight boilerplate overhead; need to keep SDK versions aligned with provider capabilities.

### Alternatives Considered

1. **Monolithic `app.py`**: Fewer files but tightly coupled and harder to test.
2. **Framework-specific DI containers**: Potentially powerful but overkill for a small API.

### Operational Notes

* Log key lifecycle events (mounts, router inclusion, root\_path) for deploy diagnostics.
* If mounting under a subpath (e.g., behind a proxy), ensure `ROOT_PATH` is passed to the frontend as `window.ROOT_PATH`.
* Provide a `/health` endpoint for simple readiness checks.

### Related Decisions

* ADR-004 (Error handling & observability) — future.

---

## ADR-003: JavaScript Without a Build Step (ESM + Import Maps)

**Status:** Accepted (2025-08-13)

### Context

We want modern JS ergonomics (ES modules, bare specifiers, tree-shakeable libs) without introducing a bundler (Vite/Webpack). The environment may be offline, so all libraries must be served locally.

### Decision

Use **native ES Modules** and **import maps** with locally hosted ESM builds:

* **Import map in `templates/index.html`** resolves bare specifiers to local files:

  * `"vue": "/static/libs/vue.esm-browser.js"`
  * `"dexie": "/static/libs/dexie.mjs"`
  * `"pdfjs": "/static/libs/pdf.mjs"`
* **App modules** import from these bare specifiers (e.g., `import { createApp } from 'vue'`).
* **No globals**: Prefer ESM imports to globals; configure PDF.js worker via ESM at runtime.
* **State & data**: Use Dexie (ESM) with explicit schema versions and migrations (e.g., add `createdAt` index).

### Rationale

* **Simplicity**: Avoids build complexity, CI steps, and dev/prod parity issues.
* **Modern syntax**: First-class `import`/`export` across all app code.
* **Offline**: All assets are local; no CDN dependency.

### Consequences

* **Pros**: Lower tooling overhead; easy to read and debug; modules cache well in browsers.
* **Cons**: No bundling means more HTTP requests (mitigated by HTTP/2/3); no transpilation for legacy browsers.

### Alternatives Considered

1. **Vite bundling**: Fast dev server and optimizations, but adds infra and build artifacts not desired here.
2. **SystemJS**: Works offline but adds a runtime loader and complexity.

### Operational Notes

* Ensure FastAPI serves `*.mjs` with `application/javascript`. (Project adds MIME mapping.)
* Keep worker paths stable; set `pdfjsLib.GlobalWorkerOptions.workerSrc` to `/static/libs/pdf.worker.mjs` (or `${window.ROOT_PATH}/static/libs/pdf.worker.mjs`).
* When upgrading libraries, replace the files in `/static/libs` and adjust the import map if filenames change.

### Related Decisions

* ADR-001 (client-side processing) and ADR-005 (Library versioning policy) — future.

---

## ADR-004: Data Storage on Client (IndexedDB via Dexie)

**Status:** Accepted (2025-08-13)

### Context

We persist processed PDFs and extracted text locally for resilience and faster reloads.

### Decision

Use **IndexedDB** with **Dexie (ESM)** and versioned schema:

* **Schema v1**: `pdfs: '++id, name, fileHandle, pages, responseText'`.
* **Schema v2**: add `createdAt` index and migration to backfill missing values.
* Provide convenience queries (`orderBy('createdAt').reverse()`) in the app.

### Rationale

* Dexie simplifies async IndexedDB interactions and schema migrations.
* Local storage avoids server persistence and aligns with privacy goals.

### Consequences

* **Pros**: Offline-friendly; low-latency reads/writes.
* **Cons**: Browser storage quotas; serialization limits for very large blobs.

### Alternatives Considered

1. **LocalStorage**: Too limited and synchronous.
2. **OPFS / File System Access API**: Powerful but uneven browser support and permissions UX.

### Operational Notes

* Consider chunking or lazy-loading very large image arrays.
* Provide a maintenance action to purge older entries.

### Related Decisions

* ADR-001 and ADR-003.

---

## ADR-005: Template Rendering and Routing

**Status:** Accepted (2025-08-13)

### Context

We serve a single-page application via FastAPI with Jinja2. The app may be mounted under a subpath, and we want to avoid template collisions with Vue’s mustaches.

### Decision

* Use custom Jinja2 delimiters `[[ ... ]]` to avoid clashing with Vue.
* Pass `root_url` from the backend to set `window.ROOT_PATH` at runtime.
* Route all non-API paths to `index.html` (SPA fallback) and mount `/static` for assets.

### Rationale

* Simplicity for deployment; SPA friendly; keeps templating boundaries clear.

### Consequences

* Mixed templating requires discipline: only use `[[ ... ]]` for server-side values and Vue for client-side.

### Alternatives Considered

* Server-side templates for most views (not needed for SPA).

### Operational Notes

* Keep the fallback route last to avoid shadowing API routes.

### Related Decisions

* ADR-002 and ADR-003.

---

## ADR-006: Error Handling & Observability (Initial)

**Status:** Proposed (2025-08-13)

### Context

We need predictable error surfaces for both client and server.

### Decision

* **Client**: Centralize status messages; surface recoverable errors in UI; console-log with structured context.
* **Server**: Log request lifecycle and exceptions; convert internal errors to 5xx with user-safe messages; keep a `/health`.

### Rationale

* Improves debuggability without adding heavy APM at this stage.

### Consequences

* Minimal runtime overhead; clear operator signals.

### Alternatives Considered

* Full tracing/metrics stack (OpenTelemetry); left for a future phase.

### Operational Notes

* Add correlation IDs or request IDs if concurrency grows.

### Related Decisions

* ADR-002.
