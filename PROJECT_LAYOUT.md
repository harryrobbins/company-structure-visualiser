# Project Layout

This project should follow the following layout pattern

## Example 1:

```
/e/www/coda# tree
.
├── CODE_STANDARDS.md
├── GOALS.md
├── app
│   ├── __init__.py
│   ├── __pycache__
│   │   ├── __init__.cpython-311.pyc
│   │   ├── config.cpython-311.pyc
│   │   ├── llm_client.cpython-311.pyc
│   │   ├── llm_interface.cpython-311.pyc
│   │   ├── main.cpython-311.pyc
│   │   └── models.cpython-311.pyc
│   ├── config.py
│   ├── llm_client.py
│   ├── llm_interface.py
│   ├── main.py
│   └── models.py
├── check_types.sh
├── mypy.ini
├── repomix.config.json5
├── repomix.sh
├── repomix.txt
├── requirements.txt
├── run.sh
├── static
│   ├── assets
│   ├── css
│   │   ├── libs
│   │   │   └── a11y-dark.min.css
│   │   └── styles.css
│   └── js
│       ├── components
│       │   ├── AnalysisView.js
│       │   ├── App.js
│       │   ├── CodePreview.js
│       │   ├── FileTree.js
│       │   ├── ProjectList.js
│       │   └── ProjectView.js
│       ├── libs
│       │   ├── dexie.min.js
│       │   ├── highlight.min.js
│       │   ├── jszip.min.js
│       │   ├── marked.min.js
│       │   ├── split.min.js
│       │   ├── split.min.js.map
│       │   ├── tailwind.cdn.js
│       │   └── vue.global.prod.js
│       ├── main.js
│       └── services
│           ├── api.js
│           ├── db.js
│           └── zip_handler.js
├── templates
│   └── index.html
```

## Example 2:

```
/e/www/aigent# tree
.
├── README.md
├── __pycache__
│   └── app.cpython-311.pyc
├── api
│   ├── __init__.py
│   ├── __pycache__
│   │   ├── __init__.cpython-311.pyc
│   │   └── analyze.cpython-311.pyc
│   └── analyze.py
├── app.py
├── bootstrap.sh
├── core
│   ├── __init__.py
│   ├── __pycache__
│   │   ├── __init__.cpython-311.pyc
│   │   ├── config.cpython-311.pyc
│   │   └── llm_client.cpython-311.pyc
│   ├── config.py
│   └── llm_client.py
├── demo
│   └── sample_agents.json
├── docker-compose.yml
├── repomix.config.json5
├── repomix.sh
├── repomix.txt
├── requirements.txt
├── run.sh
├── static
│   ├── css
│   ├── js
│   │   ├── agents-view.js
│   │   ├── analysis-detail-view.js
│   │   ├── analysis-runs-view.js
│   │   ├── components.js
│   │   ├── db.js
│   │   ├── docs-view.js
│   │   ├── home-view.js
│   │   ├── logger.js
│   │   ├── main.js
│   │   ├── results-view.js
│   │   ├── sets-view.js
│   │   └── settings-view.js
│   └── libs
│       ├── dexie.min.js
│       ├── docx.js
│       ├── mammoth.browser.min.js
│       ├── pdf.mjs
│       ├── pdf.worker.mjs
│       ├── showdown.min.js
│       ├── tailwind.js
│       ├── vue.global.js
│       └── xlsx.full.min.js
└── templates
    └── index.html
```