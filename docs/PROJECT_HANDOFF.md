# Carbon-Aware Supply Chain Dashboard: Project Handoff

This document is the continuation context for future AI sessions and teammates. Read it together with `AGENTS.md`, `docs/GLOSSARY.md`, `docs/API_CONTRACT.md`, `docs/PAGES.md`, and `docs/BACKEND_PROGRESS.md`.

## Product

Carbonix is a Scope 3 supplier-emissions dashboard.

Core flow:

```text
CSV/manual supplier activity
  -> FastAPI validation and persistence
  -> Model A fills missing activity when needed
  -> modular carbon engine calculates official CO2e
  -> database stores emission results
  -> rankings, dashboard, hierarchy, map, and recommendations update
  -> frontend displays live API responses
```

Official emissions are always calculated by the Python engine. ML never owns official CO2e totals.

## Repository Structure

```text
frontend/                 React + Vite frontend
backend/app/              FastAPI routes, persistence, auth, adapters
backend/engine/           Modular carbon engine, factors, risk, scenarios
backend/ml/model_a/       Activity gap-fill model
backend/ml/model_b/       Recommendation candidate ranking model
backend/alembic/          Database migrations
backend/tests/             Backend, engine, API, and ML tests
fixtures/                 Demo data and golden test data
docs/                     Contracts and team handoff documents
```

## Current State

The main backend and frontend flows are implemented and connected.

- Backend: FastAPI + SQLAlchemy
- Database default: SQLite at `backend/carbon_aware.db`
- PostgreSQL: supported with `DATABASE_URL`
- Frontend API base URL: `http://localhost:8000`
- Frontend dev URL: `http://localhost:5173`
- Demo organization: `org_apex`
- Demo period: `2025`
- Demo token: `demo-token-apex`

## Backend Completed

### API and persistence

- FastAPI application in `backend/app/main.py`
- SQLAlchemy models for organizations, users, suppliers, factors, emission results, and recommendations
- Alembic migrations:
  - `0001_initial_schema`
  - `0002_recommendations`
- Local startup schema creation for development
- PostgreSQL-compatible `DATABASE_URL`
- CORS for `http://localhost:5173`

### Authentication

- `POST /auth/demo`
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- PBKDF2 password hashing
- Signed expiring bearer tokens
- Protected non-public API routes
- Demo token remains supported for v1 development

Current auth limitation: user/org identity is authenticated, but every business query still primarily targets the demo organization `org_apex`. Full organization-level query scoping is still required before production deployment.

### Supplier and CSV flows

- `GET /suppliers`
- `GET /suppliers/{supplier_id}`
- `GET /suppliers/{supplier_id}/emissions`
- `POST /suppliers`
- `PUT /suppliers/{supplier_id}`
- `POST /suppliers/demo`
- `POST /suppliers/upload`

CSV behavior:

- Validates required headers and row values
- Matches existing suppliers by name
- Creates new suppliers with generated `sup_...` IDs
- Resolves `parent_name` to `parent_id`
- Supports parents earlier in the same file
- Returns `created`, `updated`, `errors`, and `items`
- Persists data in the database
- Runs Model A for missing/zero activity
- Recalculates emissions and recommendations

### Carbon engine

The canonical live engine is the pulled modular engine in `backend/engine/`.

- Five buckets: energy, transport, material, manufacturing, logistics
- Activity multiplied by emission factor
- Fallback factor support
- Intensity calculation
- Organization ranking
- Carbon risk calculation
- Audit support
- Scenario simulation
- SQLAlchemy-to-engine adapter in `backend/app/engine_adapter.py`

There is also an older compatibility implementation in `backend/engine/carbon.py`. The live app adapter now uses the modular engine and `FactorRegistry`.

### Database-backed read APIs

- `GET /dashboard`
- `GET /rankings`
- `GET /hierarchy`
- `GET /map/suppliers`
- `GET /factors`

These use current database suppliers, factors, and emission results. Dashboard `top_recommendations` uses the top three persisted recommendations.

### Factors

- `GET /factors`
- `PUT /factors/{factor_id}`
- Factor edits recalculate all cached emission results
- Factor edits refresh recommendations

### Recommendations and Model B

- `GET /recommendations`
- `GET /recommendations?supplier_id=...`
- `GET /suppliers/{supplier_id}/recommendations`
- `PATCH /recommendations/{recommendation_id}`

Model B is connected through `backend/app/recommendations.py`.

- Receives database supplier activity and factors
- Generates candidates
- Simulates candidates through the modular engine
- Calculates `delta_co2e_kg` from engine output
- Uses the trained ranker when available
- Falls back to deterministic ranking
- Persists recommendations in the database

### Scenario simulation

- `POST /scenarios/simulate`
- Uses current database suppliers and factors
- Uses the modular engine
- Supports:
  - `recycled_material_pct`
  - `renewable_energy_pct`
  - `rail_transport_pct`
- Returns category breakdown, current total, projected total, delta, and delta percentage

### Reports

- `POST /reports/esg`
- Uses current dashboard data
- Generates a real PDF with ReportLab
- Returns `application/pdf` with a downloadable filename
- Frontend preview uses live dashboard values

## ML Completed

### Model A

Location: `backend/ml/model_a/`

- Peer-group gap fill
- Same-organization peer adapter in `backend/app/model_a_adapter.py`
- Fills:
  - `energy_kwh`
  - `material_quantity_kg`
  - `transport_distance_km`
  - `production_volume`
- Uses material and tier peer groups with fallbacks
- Provides confidence and provenance
- Sets `data_source` to `modeled` or `mixed`
- Does not calculate official CO2e
- Connected to:
  - supplier create
  - supplier update
  - CSV upload

### Model B

Location: `backend/ml/model_b/`

- Candidate generation
- Candidate simulation through the modular engine
- Optional trained sklearn ranker artifact
- Deterministic fallback ranking
- Connected to the live recommendation refresh flow

Known warning: the committed ranker artifact was trained with sklearn `1.8.0`; older local environments may emit sklearn version warnings. Dependencies now pin `scikit-learn==1.8.0` in the ML test requirements.

## Frontend Completed

The frontend is a React/Vite app with routes for:

- Landing
- Login
- Dashboard
- Suppliers
- Supplier detail
- Hierarchy
- Map
- Recommendations
- Scenarios
- Factors
- Reports

Live-connected frontend flows:

- Demo login
- Credential login
- Signup UI with organization name, email, and password
- Supplier list/detail
- Add supplier
- Edit supplier
- CSV upload
- Demo reseed
- Dashboard
- Rankings widget
- Hierarchy
- Map
- Recommendations
- Recommendation status updates
- Factors and factor updates
- Scenario sliders
- Real PDF report download

The frontend API client is `frontend/src/services/api.ts`.

Important behavior: API calls are live-first but fall back to `frontend/src/fixtures/mockData.ts` when the backend is unavailable. This is intentional for development, but it can hide backend failures. For real integration testing, keep the backend running and inspect the browser Network tab.

The Trends feature was intentionally removed:

- Removed from frontend router
- Removed from sidebar
- Removed `TrendsPage.tsx`
- Removed from `docs/PAGES.md`

## Static or Mock Boundaries Remaining

Intentional/static:

- Fixture files seed demo data and support golden tests
- Demo login identity/token is fixed for v1
- Frontend mock fallback data remains when API calls fail
- Model B ranker artifact is a fixed trained artifact, but its inputs and engine deltas are dynamic

Not yet production-complete:

- Full organization-level data scoping for authenticated users
- Production secret management for `AUTH_TOKEN_SECRET`
- Logout/token revocation
- Password reset/email verification
- Real deployment configuration
- Frontend fallback currently silently masks API failures
- Reports are live, but the visual report preview is still a simplified UI representation

## Commands

### Backend setup

From repository root:

```bash
cd backend
/opt/anaconda3/bin/python -m pip install -e '.[ml,test]'
/opt/anaconda3/bin/alembic upgrade head
```

If the local SQLite database already contains tables created by `create_all()` but has no Alembic marker:

```bash
/opt/anaconda3/bin/alembic stamp head
/opt/anaconda3/bin/alembic upgrade head
```

Start backend from `backend/`:

```bash
/opt/anaconda3/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Or from repository root:

```bash
/opt/anaconda3/bin/python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

### Frontend setup

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`.

### Tests

Backend and ML:

```bash
/opt/anaconda3/bin/python -m pytest -q backend/tests
```

Current verified result: **76 backend/ML tests passed**; the current frontend production build also passes.

Frontend production build:

```bash
cd frontend
npm run build
```

Current verified result: **passed**.

## Endpoint Summary

Public:

- `GET /health`
- `POST /auth/demo`
- `POST /auth/signup`
- `POST /auth/login`
- API docs routes

Authenticated:

- `GET /auth/me`
- Supplier CRUD and CSV routes
- Dashboard, rankings, hierarchy, map
- Factors
- Recommendations
- Scenarios
- Reports

Frontend should call only FastAPI routes. It should not call `backend/ml` directly.

## Next Recommended Work

1. Add organization-level query scoping using the authenticated token `org_id`.
2. Move `AUTH_TOKEN_SECRET` to deployment environment configuration.
3. Add logout/revocation or short-lived refresh-token strategy.
4. Make frontend API failures visible instead of silently using mock data.
5. Add deployment configuration and PostgreSQL validation.
6. Consider removing `Base.metadata.create_all()` from production startup and require Alembic migrations.

## Working Rules

- Use snake_case everywhere.
- Do not invent fields/routes without updating contracts and fixtures.
- Official CO2e comes from the engine, never directly from ML.
- Model A fills activity; engine calculates emissions.
- Model B ranks candidates; engine calculates recommendation deltas.
- Preserve fixture shapes for frontend compatibility.
- Do not commit local databases, `__pycache__`, or `.pyc` files.
