# Carbon-Aware Supply Chain — agent briefing

This repo is a **React (Vite) frontend** + **FastAPI backend** + **two ML modules**. Four people vibe-code in parallel. **Do not invent field names, endpoints, or page routes.** If you need a new one, update `docs/GLOSSARY.md`, `docs/API_CONTRACT.md`, and `fixtures/` in the same change.

## Read before you write code

| If you are… | Read these, in order |
|---|---|
| Anyone | This file → `docs/GLOSSARY.md` → `docs/PAGES.md` |
| Frontend | `docs/API_CONTRACT.md` → `fixtures/` → `docs/ARCHITECTURE.md` |
| Backend | `docs/DATA_MODEL.md` → `docs/API_CONTRACT.md` → `docs/CARBON_ENGINE.md` |
| AI/ML | `docs/ML.md` → `docs/CARBON_ENGINE.md` → `fixtures/recommendations.json` |

## Locked stack

- Frontend: React + Vite + TypeScript, React Router, Tailwind, shadcn/ui, Recharts, React Flow, MapLibre (`react-map-gl`)
- Backend: FastAPI + Pydantic, PostgreSQL, SQLAlchemy 2, Alembic
- Carbon math: **pure Python** `activity × factor` — never a neural net for the official total
- Model A: gap-fill missing **activity** (flag `data_source: modeled`)
- Model B: rank **alternatives**; `delta_co2e_kg` comes from the engine
- Monorepo folders: `frontend/`, `backend/`, `backend/ml/`

## Integration rule

Frontend may mock with `fixtures/*.json` until the API exists. Backend responses **must match** those fixtures’ shapes. ML outputs **must match** `Recommendation` in the glossary. Same `supplier_id` values in seed/demo data (`fixtures/demo-ids.md`).

## Auth for v1

Demo login only: `POST /auth/demo` → session/JWT. No OAuth in P0.

## Errors

All API errors:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human readable", "details": [] } }
```
