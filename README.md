# Carbon-Aware Supply Chain

Dashboard for Scope 3 supplier emissions: ingest activity data, calculate CO₂e, show hotspots (list, hierarchy, map), recommend circular alternatives, and run what-if scenarios.

## Team

| Role | Owns |
|---|---|
| Frontend ×2 | `frontend/` — landing, login, app shell, pages |
| Backend | `backend/` — API, DB, CSV ingest, carbon engine, auth |
| AI/ML | `backend/ml/` — Model A (gap-fill), Model B (rank recs) |

## Shared context (read this)

Start at [`AGENTS.md`](AGENTS.md). Contracts live in `docs/`. Golden JSON lives in `fixtures/`. Cursor rules live in `.cursor/rules/`.
Backend handoff and progress are tracked in [`docs/BACKEND_PROGRESS.md`](docs/BACKEND_PROGRESS.md).

If two chats disagree, **glossary + API contract + fixtures win.**
