# Architecture

```
browser  →  Vite React SPA  →  FastAPI  →  PostgreSQL
                                 ├── engine/     carbon math
                                 └── ml/         Model A + Model B
```

## Folders (create when coding starts)

```
frontend/          React app (landing + login + dashboard)
backend/
  app/             FastAPI routers, schemas, auth
  engine/          calculate_co2e(), ranking, risk
  ml/
    model_a/       gap-fill activity
    model_b/       rank recommendations
  alembic/
docs/              contracts (this folder)
fixtures/          golden JSON
```

## Responsibilities

| Layer | Does | Does not |
|---|---|---|
| React | Pages, charts, map, forms, call API | Own official CO₂e math |
| FastAPI routes | Validate, persist, call engine/ML | Duplicate factor math in JS |
| `engine/` | Factor lookup + five-bucket totals | Call the LLM |
| Model A | Fill missing activity fields | Return `total_co2e_kg` as its main output |
| Model B | Propose/rank actions | Invent ΔCO₂e without re-running the engine |

## Auth

- `POST /auth/demo` issues a token for `org_apex`
- Send `Authorization: Bearer <token>`
- Frontend stores token in memory + `sessionStorage` (not localStorage for now)

## CORS

Frontend origin (Vite `http://localhost:5173`) allowed by FastAPI.

## Demo data

Seed from `fixtures/suppliers.json` + `fixtures/factors.json` so UI, API, and ML share the same IDs.

## P0 vs later

- P0: auth demo, suppliers CRUD/CSV, calculate, dashboard, ranking, detail, hierarchy, factors
- P1: map, recommendations, scenarios
- P2: trends, PDF, chat overlay
