If using browser-use mode (default), start the app first in a separate terminal:
  python3 -m http.server 3013

  Then run the pipeline for example:
  python -m auto_research.main --iterations 50

# TalentFlow - HR & Talent Management Platform

TalentFlow is a comprehensive, single-page HR management application. It provides a centralized interface for managing the full employee lifecycle — from job postings and candidate tracking through onboarding, payroll, performance reviews, and more.

## Features

- **Dashboard** — Overview of key HR metrics: employee count, open positions, pending time-off requests, and department stats
- **Job Postings** — Create, edit, search, and filter job listings; export to CSV
- **Candidate Pipeline** — Track applicants through hiring stages, schedule interviews, review applications
- **Employee Directory** — Add, edit, search, and filter employees; bulk actions and CSV export
- **Time Off Management** — Submit, approve, and reject time-off requests
- **Performance Reviews** — Create and submit review cycles with star ratings, goals, and comments
- **Departments** — Manage departments with budgets, heads, and color-coded cards
- **Onboarding** — Create checklists with trackable items for new hires
- **Training** — Browse and enroll in training courses
- **Payroll** — View compensation summaries with base salary, bonus, deductions, and net pay
- **Documents** — Upload and manage HR documents
- **Reports** — Generate visual reports filtered by date range and department
- **Calendar** — Create and view events on a monthly calendar grid
- **Settings** — Configure notification preferences and update user profile

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- One of the following to serve the files:
  - Python 3
  - Node.js
  - Docker

### Run with Python

```bash
python3 -m http.server 3013
```

Then visit [http://localhost:3013](http://localhost:3013).

### Run with Node.js

```bash
npx serve -l 3013
```

Then visit [http://localhost:3013](http://localhost:3013).

### Run with Docker

```bash
docker build -t talentflow .
docker run -p 3013:80 talentflow
```

Then visit [http://localhost:3013](http://localhost:3013).

## Test Credentials

| Field    | Value              |
|----------|--------------------|
| Email    | test@example.com   |
| Password | password123        |

## Project Structure

```
talentflow/
├── index.html      # Main HTML shell (sidebar, header, modal, footer)
├── style.css       # All styles (layout, components, responsive)
├── js/
│   ├── data.js     # Seed data (employees, jobs, candidates, etc.)
│   ├── store.js    # In-memory data store and CRUD operations
│   ├── render.js   # Page rendering functions (HTML generation)
│   └── app.js      # Router, event handling, and application init
├── Dockerfile      # Container setup using nginx
└── README.md
```

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no frameworks or build tools)
- **Routing**: Hash-based SPA routing
- **Storage**: In-memory data store with session persistence
- **Server**: Any static file server (nginx in Docker)

## Auto Research QA

The repository also includes an `auto_research/` pipeline that trains and exports
specialized QA skills. Its default execution mode is now **browser-use** mode:
it starts the benchmark app on `http://127.0.0.1:3013` when needed, launches a
local Chromium browser with CDP on `http://127.0.0.1:9222`, and has the agents
inspect the live app in the browser instead of reading repository code to hunt
for issues.

### Install Browser-Use Dependencies

```bash
pip install -e .[browser-use]
```

Authentication uses OAuth2 tokens from `~/.browser-use/openai_oauth2_tokens.json`
(your ChatGPT subscription). Run `openai_oauth2_login()` once if you haven't yet.
No `OPENAI_API_KEY` needed.

### Run Auto Research

```bash
python -m auto_research.main --mode browser-use --iterations 1 --export
```

Useful variants:

```bash
python -m auto_research.main --single happy_path --mode browser-use --iterations 1
python -m auto_research.main --mode browser --iterations 1
python -m auto_research.main --mode source --iterations 1
```

If you already have the app running elsewhere, pass its URL:

```bash
python -m auto_research.main --mode browser-use --app-url http://127.0.0.1:3013 --iterations 1
```

## License

Copyright 2024 TalentFlow. All rights reserved.
