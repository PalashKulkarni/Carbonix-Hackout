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
Complete project continuation context is tracked in [`docs/PROJECT_HANDOFF.md`](docs/PROJECT_HANDOFF.md).

If two chats disagree, **glossary + API contract + fixtures win.**

## ML Benchmarks

The backend ML components (Model A and Model B) and the Carbon Engine have been empirically benchmarked and audited. Key results:

* **Model A** (Gap-fill): Achieves a 60% reduction in MAE compared to a global mean baseline using peer-group ratio scaling.
* **Model B** (Recommendations): The trained ML ranker successfully learns domain heuristics, achieving **97.67% Top-1 Accuracy** and **0.9996 NDCG@3** (outperforming naive deterministic CO₂e sorting).
* **Performance**: Production inference latency is highly efficient (~0.035ms for Engine, ~6.6ms E2E for Model B generation+ranking).
* **System Quality**: 54/54 automated tests pass, proving mathematical invariants and E2E integration.

For full methodology, metrics, limitations, and reproduction commands, please see the authoritative reference: [docs/ML_BENCHMARKS.md](docs/ML_BENCHMARKS.md).
