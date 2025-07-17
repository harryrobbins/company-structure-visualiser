# AIGENT

# AIGENT

**AIGENT** is a self-contained web application for defining and running AI-powered “agents” to analyze user-uploaded documents. All data is stored client-side; the backend serves only as a proxy to an internal OpenAI endpoint.

## Features

- Define custom AI Agents with prompts and ranking specs
- Organize agents into named Sets
- Upload documents (PDF, DOCX, XLSX, TXT/MD, images)
- Run parallel analyses per agent and view results with labeled scale graphics

## Prerequisites

- Docker & Docker Compose
- Access to a private OpenAI-compatible endpoint

## Getting Started

1. **Clone the repo**

   ```bash
   git clone <repo-url>
   cd aigent
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and fill in your OpenAI endpoint & key:

   ```bash
   cp .env.example .env
   ```

3. **Build and run**

   ```bash
   docker-compose up --build
   ```

4. **Access the app**

   Visit `http://localhost:8000` in your browser.

## Project Structure

```
├── backend/
│   ├── app.py
│   ├── api/analyze.py
│   ├── core/
│   │   ├── config.py
│   │   └── llm_client.py
│   └── templates/index.html
├── frontend/
│   ├── index.html
│   └── static/
│       ├── css/tailwind.js
│       ├── js/*.js
│       └── libs/*
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Configuration

- API base, key, and root URL via environment variables or `.env`

## Next Steps

- Implement text extraction in the frontend
- Add Dexie.js schema and persistence
- Wire up analysis execution and real-time results


## Goals

I want to create a web app that allows user to create sets of AI "Agents" that can help them analyse documents.

An Agent in this case is basically a prompt which asks an LLM to analyse the attached documents in a particular way and return a report and, optionally, one or more rankings.

For example a prompt might consist of 
```yaml
prompt:
    You are an expert nutritionist. Analyse the attached recipes for food that is not diabetes friendly and make supportive suggestions on how it could be adjusted or have ingredients substituted to make it more healthy
rankings:
    - title: Current diabetes friendliness
      instructions: Rank the current recipe from 1-10 in terms of how diabetes friendly it is, with 1 being least diabetes-friendly and 2 being the most
    - title: Ease to adapt
      instructions: Rank the recipe in terms of how easy it is to adapt to being diabetes friendly, with 1 being almost impossible to adapt and 10 being easy to adapt
```
The agents could be anything - e.g. tax inspectors, creative writing partners, etc. - the prompt could be very detailed so the UI should have plenty of space.

The user can define new agents in the app via a form.

The user can create sets/folders of agents to use together, and can assign an agent to multiple sets. The sets have names like "healthy food" or "party food".

Once a user selects a set there are some tabs:
 - Agents (lists the selected agents and allows user to add/remove/create new agents)
 - Documents (lists uploaded documents with previews and allows user to remove docs)
 - Results (responses from the agent once they are returned)

Once the user has a set of agents, they cen upload a set of documents through drag and drop. They can also populate a textarea with some Document Context to explain what the document are and what the overall goal of the analysis is.

Once they're happy with their uploads they can click "Send to agents", which triggers the agent analysis phase. The analysis phase sends the following information to each agent in parallel:
 - the agent description/system prompt, including the main prompt and ranking descriptions
 - the filename and content of each document
 - the context/overall goal the user supplied

As the agents return their responses they should appear in the Results tab, with the agent name, the text response, and any rankings.

## Tech 
I want to use fastapi for the backend and vuejs for the frontend with components in native .js files rather than vue files - I don't want any build step. I want to use tailwind css - just the js with no build step. All the libraries need to be loaded locally from a static directory as there is no internet in my environment.

FastAPI should serve the VueJS app. Jinja should be configured to use different delimiters so that the `{{` tags don't interact with the Vue template. In the templates use {{ url_for('static', '...') }}, etc. for static content and any ajax endpoints, so i can define a root_url in the fastapi app and requests still go to the right place if my app is not at the server root.

I want the frontend to extract text from xlsx, PDF, docx, txt and md files. It should be sent to the backend as plain text. The user should be able to preview the extracted text for each document.

I don't want to store any data in the backend. I want to use Dexie to store all the data in the browser including the agents, agent sets, documents and responses. 

The logical hierarchy/sitemap of the app is:
    * Home (links to other areas)
    * Agents (list of all agents and create new/delete/edit)
    * Agent sets (collections of agents that documents can be uploaded to)
        * Analysis runs (sets of documents that were analysed by the agents)
            * Agents
            * Docs
            * Results
    * Analysis (aggregated list of all analysis, including which agent set was used)
            * Agents
            * Docs
            * Results

Use the openai python sdk for communicating with the backend.

Use pydantic classes for defining any data interfaces and typing the response from the LLM.



AIGENT: Next Steps and Analysis
This document outlines the path forward for the AIGENT application, turning the existing stubs into a fully-featured, robust, and user-friendly tool.

1. Foundational Setup & Configuration
The immediate priority is to get the basic application running and establish a solid foundation for future development.

Dexie.js Integration: The frontend currently references a db object that doesn't exist. The first step is to integrate Dexie.js and define the database schema. This will involve:

Downloading the dexie.js library and adding it to frontend/static/libs/.

Creating a frontend/static/js/db.js file to initialize Dexie and define the tables: agents, agentSets, documents, and results.

Loading db.js in index.html before the other component scripts.

Frontend Library Integration: The bootstrap.sh script references several libraries for file parsing (pdf.min.js, xlsx.js, docx.js, showdown.min.js). These need to be:

Downloaded and placed in frontend/static/libs/.

Loaded in index.html.

Docker Compose & Environment:

The docker-compose.yml file needs to be created. It should define a single service for the FastAPI application.

The .env file should be properly configured with your OpenAI-compatible API endpoint and key.

2. Core Frontend Features
With the foundation in place, the next step is to build out the core user-facing features.

Text Extraction (docs.js): The extractText function is a stub. This needs to be implemented to handle different file types:

PDF: Use pdf.min.js.

Word (.docx): Use docx.js or a similar library.

Excel (.xlsx): Use xlsx.js.

Markdown/Text: Use showdown.min.js for Markdown rendering and a simple FileReader for plain text.

Images: The fileToBase64 function is a good start, but you'll also need to handle sending this data to the LLM, which may require a multi-modal model.

Agent & Agent Set Management:

Implement the "Create Agent" functionality, likely using a modal or a separate form view. This form should capture the agent's name, prompt, and ranking specifications.

The "Create Set" functionality should be enhanced to allow adding existing agents to the set.

Build out the views for managing agents within a set (adding/removing).

Analysis Workflow:

Create the main analysis view where users can select an agent set, upload documents, and provide context.

Implement the "Send to agents" button functionality. This will trigger the API calls to the backend.

The results-view should be updated to handle real-time updates as agent responses are received.

UI/UX Enhancements:

Replace alert() and prompt() calls with more user-friendly modals or inline forms.

Add loading indicators for asynchronous operations (e.g., file uploads, analysis runs).

Improve the layout and styling to make the application more intuitive and visually appealing.

3. Backend API Implementation
The backend needs to be robust enough to handle the analysis requests from the frontend.

LLM Client (llm_client.py):

The current implementation is a good start. It should be enhanced with more robust error handling and logging.

Consider adding support for different models and parameters if needed.

API Endpoint (analyze.py):

The /api/analyze endpoint is well-defined. Ensure it correctly handles the incoming data from the frontend and passes it to the LLMClient.

Add logging to track requests and responses.

4. Connecting Frontend & Backend
The final step is to wire everything together.

API Calls from Frontend: Implement the JavaScript functions that will call the /api/analyze endpoint. This will involve:

Gathering the agent data, documents, and context from the Dexie.js database.

Sending this data in the request body.

Handling the response and storing the results back into Dexie.js.

Real-time Updates: Use a simple polling mechanism or a more advanced solution like WebSockets (if desired) to update the results-view in real-time as analysis results become available.

Project Timeline & Phasing
Here's a suggested order of implementation:

Phase 1: Foundation (1-2 days)

Docker setup

Dexie.js integration

Frontend library setup

Phase 2: Core Functionality (3-5 days)

Text extraction

Agent/Set management forms

Basic analysis workflow (no API calls yet)

Phase 3: Backend & API (2-3 days)

Refine LLMClient

Test the /api/analyze endpoint with sample data

Phase 4: Integration & Polish (3-5 days)

Connect frontend to the backend API

Implement real-time result updates

UI/UX improvements and bug fixing

By following this roadmap, you can systematically build out the AIGENT application into a powerful and impressive proof of concept.

