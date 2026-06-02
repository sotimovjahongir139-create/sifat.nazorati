# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

QC defect-tracking dashboard ("Sifat Nazorati") for a footwear factory. UI and all
user-facing strings are in Uzbek. Operators log production defects; bosses/admins
review aggregate stats.

## Commands

All commands run from `backend/`:

```bash
cd backend
npm install          # install deps
npm run dev          # nodemon, src/server.js, port 3000
npm start            # production: node src/server.js
npm run migrate      # run migrations standalone (also runs automatically on every server start)
```

No test suite and no linter are configured.

Local dev needs `backend/.env` (copy `backend/.env.example`): `DATABASE_URL`,
`JWT_SECRET`, `NODE_ENV`, `PORT`. A PostgreSQL instance must be reachable.

## Canonical vs. legacy code — read this first

The repo contains **three** implementations; only one is live. Do not edit the wrong set.

- **Canonical (deployed):** `backend/src/**` + `frontend/**`. `render.yaml` runs
  `node src/server.js` with `rootDir: backend`. `backend/src/server.js` serves the
  `frontend/` directory as static assets.
- **Legacy backend (unused):** `backend/server.js` + `backend/routes/` + `backend/db/`
  + `backend/db/schema.sql`. A flatter, older Express app. Not referenced by `render.yaml`
  or `package.json` `main`.
- **Legacy standalone frontend (unused):** root `index.html` + `config.js`. A single-file
  client-only app with no backend — auth is a SHA-256 password hash in `localStorage`.
  Unrelated to the `backend/src` API.

When making changes, work in `backend/src/` and `frontend/` unless explicitly asked otherwise.

## Architecture (`backend/src/`)

Standard Express MVC: `routes/` → `controllers/` → `config/database.js` (pg Pool).

- **Database:** PostgreSQL, exactly two tables — `users` and `entries`. There is no
  `defects` or `models` table despite the API naming. `entries` is the defect-record
  table; `category` is one of `qayta` / `yamala` / `orta`.
- **Migrations:** `src/migrations/run.js` runs on every server startup. It is idempotent
  (`CREATE TABLE IF NOT EXISTS` + seed users via existence check), so restarting is safe.
  `001_init.sql` is a reference copy of the schema, not executed by the app.
- **Auth:** JWT bearer tokens (24h expiry). `middleware/auth.middleware.js` (`requireAuth`)
  guards every route group except `POST /api/auth/login`. Login is rate-limited to
  5 attempts / 15 min per IP. JWT payload carries `{ id, username, role }`.
- **Roles & authorization:** `operator` / `boss` / `admin`. Authorization is enforced
  *inside controllers*, not in middleware — e.g. `defects.controller.list` filters by
  `created_by` for non-privileged users, and `remove` rejects non-admins. Keep this
  pattern when adding endpoints.
- **Route aliases:** `routes/index.js` mounts `/defects` and `/entries` to the same
  router, and `/stats` and `/analytics` to the same router, for backward compatibility.
  The "defects" controller queries the `entries` table and returns `category` aliased
  as `cat`. "Models" are not stored — `models.controller` returns `DISTINCT sku` from
  `entries`.

## Frontend (`frontend/`)

Vanilla HTML/CSS/JS, no build step. Loaded as static files by the backend.

- `js/api.js` — API client. The JWT is held in a module-scoped variable **in memory
  only**, deliberately never written to `localStorage`. A page reload logs the user out.
- `js/auth.js` login/logout, `js/charts.js` Chart.js graphs, `js/app.js` navigation/
  forms/tables. `API_BASE` is `/api` (same-origin; frontend is served by the API server).

## Deployment

Render.com Blueprint (`render.yaml`): one Node web service + one PostgreSQL database.
`DATABASE_URL` is injected from the DB, `JWT_SECRET` is auto-generated. `database.js`
enables SSL (`rejectUnauthorized: false`) only when `NODE_ENV=production`.
