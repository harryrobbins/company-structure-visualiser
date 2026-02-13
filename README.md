# Company Structure Visualizer


An interactive web application to visualize complex company ownership structures from an XLSX file.

## Technology Stack

### Frontend

-   **Framework**: [Vue.js](https://vuejs.org/) 3 (with Composition API)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/), [govuk-frontend](https://github.com/alphagov/govuk-frontend)
-   **Graph Visualization**: [Vue Flow](https://vueflow.dev/)
-   **Client-Side State**: [Dexie](https://dexie.org/) (for IndexedDB)
-   **Package Manager**: [pnpm](https://pnpm.io/)

### Backend

-   **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
-   **Server**: [Uvicorn](https://www.uvicorn.org/)
-   **Templating**: [Jinja2](https://jinja.palletsprojects.com/)

---

## Setup and Installation

### Prerequisites

-   [Node.js](https://nodejs.org/) (v22 or newer)
-   [pnpm](https://pnpm.io/installation)
-   [Python](https://www.python.org/) (v3.13 or newer)

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/harryrobbins/company-structure-visualiser.git
    cd company_visualiser
    ```

2.  **Setup the ui:**
    ```bash
    pnpm -C ui install
    pnpm -C ui build
    ```

3.  **Setup the Backend:**
    ```bash
    uv sync
    ```

---

## Development

For the best ui development experience, run the vite development server alongside the FastAPI backend. The Vite server will automatically proxy API requests to the backend, allowing for hot-reloading of frontend changes.

**Terminal 1: Start the FastAPI Backend**
```bash
uv run company_structure_api
```
The backend will be running at `http://localhost:8050`.

**Terminal 2: Start the Vite Frontend Dev Server**
```bash
pnpm -C ui dev
```
The Vite server will start, typically at `http://localhost:5174`. **Open this URL in your browser.** The frontend will automatically proxy any API requests to the FastAPI backend.
