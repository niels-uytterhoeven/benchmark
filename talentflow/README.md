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

## License

Copyright 2024 TalentFlow. All rights reserved.
