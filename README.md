# Whippet Dog Platform

A full-stack web platform designed to support the management of whippet dog racing and competitions. The system provides tools for managing dog records, meet results, titles, standings, and administration abilites. It is built using a RESTful API backend, a React frontend, and a role-based access control system that allows administrators to manage user permissions.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Permissions System](#permissions-system)

---

## Features

- **Dog Management** — Register dogs, track grades, points, titles, and race history
- **Meet & Race Results** — Record meet and individual race results; stats and titles update automatically
- **Title Tracking** — Auto-assign titles (ARX, NARX, TRP, PR, DPC, HC) based on a dog's stats
- **Person Accounts** — User registration, login, and session-based authentication
- **Role-Based Permissions** —  Uses a scope system (NONE / SELF / ALL) to control what users can do with dogs, titles, and meets. Admins have full access, while other users are limited based on their role.
- **Statistics** — All-time and yearly leaderboards, filterable by dog, owner, and year
- **CSV Importer** — Bulk import dogs, meets, meet results, and race results
- **Database Dump & Restore** — Download and restore the full database via API

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, Flask, Gunicorn |
| Frontend | Next.js (Node 20), React |
| Database | MySQL 8.0 |
| Auth | Session-based (Flask sessions + cookies) |
| API Style | REST |
| Reverse Proxy | Nginx |
| Containerization | Docker / Docker Compose |

---

## Project Structure

```
whippet_dog_platform/
├── backend/                     # Flask REST API backend
│   ├── classes/                 # Python classes representing database entities
│   ├── controller/              # API controllers / endpoint logic
│   ├── CSVs/                    # CSV import testing
│   ├── utils/                   # Shared helper utilities
│   ├── venv/                    # Python virtual environment
│   ├── config.py                # Application configuration
│   ├── csv_import.py            # CSV import functionality
│   ├── database.py              # Database connection logic
│   ├── main.py                  # Flask application entry point
│   ├── requirements.txt         # Python dependencies
│   └── router.py                # Route registration for API endpoints
|
├── backups/                     # Auto-generated daily DB backups
|
├── mysql/
│   ├── init/                    # SQL files auto-run on first DB startup
│   └── migrations/              # Schema migrations (mounted read-only into backend)
|
├── nginx/
│   └── default.conf             # Nginx reverse proxy config
|
├── web/                         # Next.js frontend
│   ├── app/                     # Next.js App Router pages and route folders
│   │   ├── admin/               # Admin pages
│   │   ├── api/                 # Next.js API routes
│   │   ├── components/          # Shared frontend components
│   │   ├── contact/             # Contact page
│   │   ├── events/              # Events and meet pages
│   │   ├── getting_started/     # Onboarding / getting started pages
│   │   ├── register/            # Registration pages
│   │   ├── rules_and_grading/   # Rules and grading pages
│   │   ├── search/              # Search pages
│   │   ├── settings/            # User settings pages
│   │   ├── stats_and_titles/    # Statistics and title pages
│   │   ├── favicon.ico          # Site favicon
│   │   ├── globals.css          # Global stylesheet
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Homepage
│   │
│   ├── lib/                     # Shared utilities, helpers, and configs
│   ├── prisma/                  # Prisma schema/configuration files
│   ├── public/                  # Static assets
│   ├── .next/                   # Next.js build output (generated)
│   ├── node_modules/            # Installed dependencies (generated)
│   │
│   ├── eslint.config.mjs        # ESLint configuration
│   ├── next-env.d.ts            # Next.js TypeScript definitions
│   ├── next.config.ts           # Next.js configuration
│   ├── package-lock.json        # NPM lock file
│   ├── package.json             # Project metadata, scripts, dependencies
│   ├── postcss.config.mjs       # PostCSS configuration
│   ├── prisma.config.ts         # Prisma configuration
│   ├── README.md                # Frontend documentation
│   └── tsconfig.json            # TypeScript compiler configuration
|
├── api_documentation.pdf        # Generated API documentation
│
├── backup.sh                    # Database backup script
│
├── docker-compose-dev.yml       # Docker configuration for development environment
│
├── .gitignore                   # Files ignored by Git
│
└── README.md                    # Project documentation
```

---

## Getting Started

### Prerequisites

Only **Docker** and **Docker Compose** are required. No local Python, Node, or MySQL installation needed.

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/) (v2+)

---

## Configuration

Before running the application, make sure your environment is set up correctly.

### Port Requirements

Make sure port `3306` is available on your system (or update the Docker port mapping if needed). This is required for the MySQL database.

---

### Environment Files

Rename the example environment files:

```bash
cp example-.env.database .env.database
cp example-.env.backend .env.backend
cp example-.env.cloudflared .env.cloudflared


---

Then update each file:

- **.env.database**
  - Set your database password and MySQL configuration

- **.env.backend**
  - Seed account information  
  - Resend API key  
  - Application secret keys  

- **.env.cloudflared**
  - Add your Cloudflare tunnel token  
  - If you are not using Cloudflare locally, follow the instructions in `docker-compose.yml` to disable this service

## Running the App

### Start the full stack

docker compose up --build

This runs the default (production-style) setup.  
For development, use:

docker compose -f docker-compose-dev.yml up --build

This starts five services:
- db — MySQL 8.0 on internal port 3306
- backend — Flask/Gunicorn API
- frontend — Next.js app
- nginx — Reverse proxy on site (routes /api/* → backend, everything else → frontend)
- backup — Runs backup.sh once on start, then every 24 hours, outputs to ./backups/
- cloudflared — Cloudflare Tunnel service

---

### Access the app

Service | URL
--- | ---
Web app | http://localhost
API | http://localhost/api
Frontend (direct) | http://localhost:3000
Backend (direct) | http://localhost:8000
MySQL (host) | 127.0.0.1:3306

---

### Stop the stack

docker compose down 

To also remove volumes (wipes the database):

docker compose down -v

---

### Rebuild a single service

docker compose up --build backend

## API Reference

Full API documentation (all endpoints, request bodies, permission requirements, and curl examples) is available in the project folder.

**Base URL:** `http://localhost/api`

**Authentication:** Session cookie required for all POST endpoints. Pass `-b cookies.txt` in curl, or ensure your HTTP client sends the session cookie.

**Quick reference — resource groups:**

| Resource | Base Path |
|---|---|
| Authentication | `/api/auth` |
| Person | `/api/person` |
| Dog | `/api/dog` |
| Dog Owner | `/api/dog_owner` |
| Dog Title | `/api/dog_title` |
| Meet | `/api/meet` |
| Meet Result | `/api/meet_result` |
| Race Result | `/api/race_result` |
| Stats | `/api/stats` |
| User Role | `/api/user_role` |
| Title Type | `/api/title_type` |
| Importer | `/api/import` |
| Change Log | `/api/change_log` |
| Contact | `/api/contact` |
| Database | `/api/database` |

---

## Permissions System

Access to create, edit, and delete resources is controlled by **scope values** on each user role. Every resource has its own scope field (e.g. `editDogScope`, `editMeetScope`).

| Value | Name | Meaning |
|---|---|---|
| `0` | NONE | No access — cannot create, edit, or delete |
| `1` | SELF | Limited access — restricted to own resources only |
| `2` | ALL | Full access — can create, edit, or delete any record |

**Built-in roles:**

- `PUBLIC` — Default role assigned on registration. Read-only access.
- `ADMIN` — Full access across all scopes. Protected; cannot be edited or deleted.

Custom roles can be created via `POST /api/user_role/add` with any combination of scope values per resource.

---

*For questions or issues, reach out to the project maintainer.*
