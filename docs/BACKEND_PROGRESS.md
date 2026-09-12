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
- Alembic configuration and initial schema migration
- Automatic local schema creation and demo seeding
- Shared fixture loader
- SQLAlchemy-to-modular-engine adapter for live application calculations
- Import compatibility for launching from the repository root or `backend/`
- Reproducible ML test dependencies and sklearn artifact version pin
- Local SQLite databases ignored by git

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

### Recommendations Partial Implementation

- Added the `recommendations` table and Alembic revision `0002_recommendations`
- Added rule-based candidate generation in `backend/app/recommendations.py`
- Candidate types currently include recycled material, renewable energy, and modal shift
- Every projected value and `delta_co2e_kg` comes from the carbon engine
- Added `GET /recommendations`
- Added `GET /recommendations?supplier_id=` filtering
- Added `GET /suppliers/{supplier_id}/recommendations`
- Added `PATCH /recommendations/{recommendation_id}` for status updates
- Recommendations refresh after supplier, CSV, demo, and factor changes

Model B is now connected to recommendation refresh. It receives database-backed supplier activity and factors, simulates candidates through the modular engine, ranks them, and persists the existing API shape.

### Model A Integration

- Added `backend/app/model_a_adapter.py` with same-organization peer isolation.
- Model A runs during supplier create, supplier update, and CSV upload.
- Filled activity is persisted before official engine calculation.
- Sparse records receive `data_source=modeled`; partial fills receive `data_source=mixed`.
- Persisted numeric activity fields are returned as JSON numbers.

### Read Endpoints

The following endpoints are now database-backed:

- `GET /dashboard`
- `GET /rankings`
- `GET /hierarchy`
- `GET /map/suppliers`

`top_recommendations` in the dashboard remains fixture-backed until recommendations are implemented.

Factors are now database-backed:

- `GET /factors`
- `PUT /factors/{factor_id}`
- Factor updates recalculate all cached emission results.

## Validation

Run from `backend/` using the configured Anaconda interpreter:

```bash
/opt/anaconda3/bin/python -m pytest -q
```

Current local app result: **16 passed**.

After ML integration, the combined backend and ML suite passes: **71 passed**. Model B emits sklearn version warnings when loading `backend/ml/model_b/artifacts/ranker_model.joblib`; those warnings do not currently fail tests.

Compile backend files with:

```bash
/opt/anaconda3/bin/python -m py_compile app/main.py app/db.py app/models.py app/repository.py app/engine_adapter.py engine/carbon.py
```

Run schema migrations from `backend/` with:

```bash
/opt/anaconda3/bin/alembic upgrade head
```

Use `DATABASE_URL` to target PostgreSQL or another database. The current development startup still calls `Base.metadata.create_all()` for an easy local first run; Alembic is the versioned schema path for shared and deployed environments.

## Next Work

### Highest priority

1. Use Alembic migrations as the standard shared/deployment schema path.
2. Implement scenario simulation using the modular engine.

### Pulled ML Work

- Model A is implemented in `backend/ml/model_a/` with peer-group gap filling, provenance, confidence, and `data_source` handling.
- Model B is implemented in `backend/ml/model_b/` with candidate generation, engine simulation, optional trained ranker loading, and deterministic fallback ordering.
- ML tests cover the new modular engine and both model services.
- Model B is connected through `backend/app/recommendations.py` and receives SQLAlchemy suppliers/factors through the app adapter.
- Model A is connected to live ingest and remains internal; the frontend still calls only documented FastAPI routes.

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
