# Carbonix

Carbonix is a carbon-aware supply chain dashboard for making Scope 3 emissions visible, auditable, and actionable. It combines deterministic carbon calculations with machine-learning assistance for missing activity data and sourcing recommendations.

## The problem

Scope 3 emissions often make up most of a company's carbon footprint, but multi-tier supplier data is incomplete and difficult to audit. Carbonix addresses that gap by mapping supplier relationships, calculating emissions from traceable inputs, identifying hotspots, and modeling reduction opportunities.

## Features

- Supplier data ingestion from CSV, manual entry, or demo data
- Deterministic emissions for energy, transport, materials, manufacturing, and logistics
- Configurable emission factors and multi-tier supply chain hierarchy
- Supplier rankings, category breakdowns, carbon risk, and hotspot analysis
- MapLibre-based geographic hotspot visualization
- Circular sourcing recommendations with simulated CO2e reductions
- What-if scenario simulation for recycled materials, renewable energy, and rail transport
- Supply chain chatbot, historical trends, and ESG report export
- Password-reset email support for local development

## How it works

1. Supplier data is ingested and organized into a multi-tier dependency tree.
2. The Carbon Engine calculates auditable emissions using `Activity Data x Emission Factor = CO2e`.
3. Model A estimates missing activity values with peer-group heuristics and labels modeled data.
4. Model B generates and ranks sourcing scenarios, while the Carbon Engine calculates their impact.
5. Users review hotspots, recommendations, scenarios, and exportable ESG reports.

## Architecture

The repository is organized into four main areas:

- `engine/`: deterministic carbon calculations, factors, scenarios, risk, and audit logic
- `backend/`: FastAPI application, persistence, authentication, reporting, and model adapters
- `frontend/`: React, TypeScript, and Vite dashboard
- `docs/`: API, architecture, data model, ML, and product documentation

The Carbon Engine is the source of truth for official totals. Machine-learning components assist with imputation and ranking, but they do not replace the deterministic calculation path.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Recharts, React Flow, MapLibre GL |
| Backend | FastAPI, Pydantic, Python |
| Database | SQLite, SQLAlchemy, Alembic |
| Data and ML | Scikit-learn, peer-group estimators, custom rankers |

## Run locally

### Prerequisites

- Python 3.9 or newer
- Node.js and npm

### Backend

From the repository root:

```powershell
cd backend
..\.venv\Scripts\python.exe -m pip install -e "."
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API documentation is available at <http://127.0.0.1:8000/docs>.

### Frontend

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Open <http://127.0.0.1:5173/> in a browser. The frontend defaults to the local API.

## Password-reset email in local development

Copy `backend/.env.example` to `backend/.env`, then set `SMTP_USERNAME` and a Gmail App Password. Never commit or share `backend/.env`.

Carbonix uses the authenticated `SMTP_USERNAME` as the sender address. Reset links use `FRONTEND_URL`, expire after 30 minutes, and can be used only once.

## Benchmark snapshot

| Component | Result |
| --- | --- |
| Model A energy estimation | 60% lower error than the baseline |
| Model A inference latency | 0.030 ms |
| Model B NDCG@3 | 0.9996 |
| Model B top-1 accuracy | 97.67% |
| Carbon Engine golden and invariant tests | 54/54 passed |

Run the test suite from `backend/` with:

```powershell
..\.venv\Scripts\python.exe -m pytest
```

## Team

Built at DAU HackOut '26 by:

- Palash Kulkarni
- Khush Patel
- Anvesh Anand Pol
- Harshil Dhameliya