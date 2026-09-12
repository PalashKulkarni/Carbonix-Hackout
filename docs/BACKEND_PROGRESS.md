# Backend Progress

This file is the backend handoff context for the team. Update it whenever backend behavior or API coverage changes.

## Current Status

The backend is a FastAPI application with SQLAlchemy persistence and a pure Python carbon engine.

- Local database: SQLite at `backend/carbon_aware.db`
- Configurable database: set `DATABASE_URL` for PostgreSQL
- Demo organization: `org_apex`
- Demo period: `2025`
- API base URL: `http://localhost:8000`

## Completed

### Foundation

- FastAPI app in `backend/app/main.py`
- CORS configured for `http://localhost:5173`
- `GET /health`
- `POST /auth/demo`
- `GET /auth/me`
- SQLAlchemy database setup and models
- Automatic local schema creation and demo seeding
- Shared fixture loader

### Carbon Engine

- Pure engine in `backend/engine/carbon.py`
- Energy, transport, material, manufacturing, and logistics buckets
- Total CO2e and intensity calculation
- Ranking by total emissions
- Carbon risk calculation
- Golden fixture tests against `fixtures/emissions.json`

### Supplier APIs

- `GET /suppliers`
- `GET /suppliers/{supplier_id}`
- `GET /suppliers/{supplier_id}/emissions`
- `POST /suppliers/demo`
- `POST /suppliers`
- `PUT /suppliers/{supplier_id}`
- Tier and parent validation
- Engine recalculation after supplier writes

### CSV Ingestion

- `POST /suppliers/upload`
- UTF-8 CSV parsing
- Header and row validation
- Numeric defaults
- Existing supplier matching by name
- New supplier ID generation
- `parent_name` resolution, including parents earlier in the same file
- Created, updated, and row-level error reporting
- Engine recalculation after upload

### Read Endpoints

The following endpoints currently return fixture-backed responses:

- `GET /dashboard`
- `GET /rankings`
- `GET /hierarchy`
- `GET /map/suppliers`
- `GET /factors`

## Validation

Run from `backend/` using the configured Anaconda interpreter:

```bash
/opt/anaconda3/bin/python -m pytest -q
```

Current result: **10 passed**.

Compile backend files with:

```bash
/opt/anaconda3/bin/python -m py_compile app/main.py app/db.py app/models.py app/repository.py app/engine_adapter.py engine/carbon.py
```

## Next Work

### Highest priority

1. Replace fixture-backed dashboard, rankings, hierarchy, and map responses with database queries.
2. Make `GET /factors` database-backed.
3. Implement `PUT /factors/{factor_id}` and recalculate all emission results after factor changes.
4. Add Alembic migrations instead of relying only on `Base.metadata.create_all()`.

### P1

- Recommendations models and endpoints
- Model B integration with engine-calculated `delta_co2e_kg`
- Scenario simulation using the same engine

### P2

- Trends and emission snapshots
- ESG report generation
- Chat endpoint using only existing GET endpoints as tools

## Team Rules

- Use `snake_case` for API, database, and JSON fields.
- Do not invent routes or field names; update the glossary, API contract, and fixtures together if a new contract is required.
- Official CO2e always comes from the pure engine, never directly from ML.
- Model A may fill activity fields, then the engine must recalculate.
- Model B may rank recommendations, but the engine must calculate every `delta_co2e_kg`.
- API errors use the shared `error.code`, `error.message`, and `error.details` envelope.
- Frontend responses must remain compatible with the fixtures until the frontend switches fully to live API data.
