<div align="center">

# 🌱 Carbonix

### Carbon-Aware Supply Chain Dashboard

**Theme: Circular Carbon Ecosystem** · Built for **DAU Hackout'26**

![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/Backend-Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy-D71F00)
![ML](https://img.shields.io/badge/ML-Estimation%20%2B%20Recommendation-green)

</div>

---

<<<<<<< Updated upstream
##  Overview
=======
## 📖 The Problem: The Scope 3 Black Box
>>>>>>> Stashed changes

For most large corporations, **Scope 3 emissions** (indirect emissions originating in the value chain) account for over **70-90%** of their total carbon footprint. 

However, accurately tracking and reducing these emissions is a massive challenge because:
1. **Data Scarcity:** Companies lack direct visibility into Tier 2 and Tier 3 suppliers.
2. **Missing Metrics:** Suppliers rarely have perfectly tracked energy or logistics data.
3. **Greenwashing Risks:** AI tools that "guess" emissions create unauditable, hallucinated figures that fail ESG compliance checks (like COP28 or ISSB S2 standards).

<<<<<<< Updated upstream
##  Who It's For
=======
## 💡 Our Solution: Carbonix
>>>>>>> Stashed changes

**Carbonix** is a comprehensive, AI-assisted platform that maps out a company's entire multi-tier supply chain, deterministically calculates its true carbon footprint, intelligently fills in missing supplier data without hallucinations, and recommends actionable sourcing changes to cut emissions. 

<<<<<<< Updated upstream
##  Why It Matters

- Improves the **accuracy and transparency** of Scope 3 emissions reporting
- Helps companies **identify and prioritize** the highest-impact reduction opportunities
- Supports **compliance** with growing ESG disclosure requirements

---

##  Features

### Core

- **Supplier Data Ingestion** — CSV upload, manual entry, or demo dataset (supplier name, tier, material, quantity, energy consumed, electricity source, transport distance/mode, location, production volume)
- **Carbon Emission Calculator** — computes CO₂e from energy, transportation, material, manufacturing, and logistics activity data (`Activity Data × Emission Factor = CO₂e`)
- **Emission Factor Database** — configurable factors for materials (steel, aluminium, plastic, cement), energy sources, and transport modes
- **Supply Chain Hierarchy** — tree/network visualization of multi-tier supplier relationships (Company → Tier 1 → Tier 2 → Tier 3)
- **Carbon Hotspot Identification** — ranks and sorts suppliers/activities by emissions to surface the biggest contributors
- **Carbon Dashboard** — total CO₂e, total suppliers, emissions by supplier/category/tier, and hotspot summary
- **Supplier Emission Breakdown** — per-supplier drill-down across energy, transport, materials, and manufacturing
- **Supplier Carbon Ranking** — leaderboard with rank, supplier, total CO₂e, emission intensity, and carbon risk

### High Priority

- **Carbon Hotspot Map** — MapLibre geographic heatmap weighted by supplier emissions, risk-colored supplier markers, and optional driving-route overlay with distance and transport CO₂e
- **Circular Sourcing Recommendations** — e.g. virgin → recycled materials, grid → renewable energy, air → sea/rail transport, imported → local sourcing, with estimated CO₂e reduction
- **What-If / Scenario Simulator** — adjust recycled material %, renewable energy %, rail transport % and see projected emissions, absolute and percentage reduction

### Additional

- **Supply Chain Chatbot** — conversational querying of the dataset (highest emitters, tier breakdowns, comparisons, scenarios)
- **Historical Emission Trends** — tracks total, supplier, category, and tier emissions over time
- **ESG Report Export** — auto-generated PDF with executive summary, rankings, breakdowns, hotspots, and recommendations

>  All of the above are fully implemented in this build.

---

##  Architecture
=======
It bridges the gap between raw, incomplete supply chain data and actionable, audit-ready ESG compliance.

---

## 🚀 How It Works (The User Journey)

1. **Ingest & Trace:** Users upload multi-tier supplier data (from direct Tier 1 partners down to Tier 3 raw material providers). The system builds a relational dependency tree.
2. **Calculate & Impute (Model A):** The system passes this data to our **Carbon Engine**. If a supplier forgot to report their electricity usage, **Model A** kicks in, using intelligent peer-group heuristics to estimate the missing data based on similar suppliers and production volumes.
3. **Visualize the Hotspots:** The frontend maps these suppliers geographically using **MapLibre**. Nodes are dynamically sized based on their total emissions and color-coded by carbon risk, allowing managers to instantly spot the "weak links" in their supply chain.
4. **Actionable Sourcing (Model B):** Instead of just showing the problem, Carbonix provides the solution. **Model B** surfaces high-impact "Circular Sourcing" recommendations (e.g., switching a specific Tier 2 supplier from virgin steel to recycled steel) and shows the exact projected CO₂e drop.
5. **Report & Comply:** Finally, the user exports a fully compliant, deterministic PDF audit report for their executive board or regulatory bodies.

---

## 🏗️ The Tech Funda (Architecture & Machine Learning)
>>>>>>> Stashed changes

We intentionally designed Carbonix with a strict separation of concerns to solve the "AI Hallucination" problem in carbon accounting. 

### 1. The Carbon Engine (Deterministic Source of Truth)
We wrote a pure Python calculation engine that relies on strict mathematics: `Activity Data × Emission Factor = CO₂e`. **It never uses neural networks or LLMs to output official carbon totals.** This ensures every single kilogram of CO₂e reported by Carbonix is 100% mathematically traceable and auditable.

### 2. Model A (Activity Gap-Fill ML)
Real-world supply chains have missing data. When an input like `energy_kwh` or `transport_distance_km` is missing, Model A acts as an intelligent imputer.
* **How it works:** It uses a robust **Peer-Group Estimator**. It finds peers matching the exact `material_code` and `tier`, then applies dynamic ratio scaling based on known variables (like `production_volume`). 
* **The Result:** It cuts estimation error by **60%** compared to baseline averages, all while safely flagging the data as "modeled" so auditors know exactly where it came from.

### 3. Model B (Circular Recommendation Ranker)
Recommending supply chain changes is risky. If an AI hallucinates a carbon reduction, it could cost a company millions.
* **How it works:** Model B generates valid, domain-aware alternative sourcing scenarios (e.g., "Switch Supplier X to 50% renewable energy"). It then feeds these scenarios *back* into the deterministic **Carbon Engine** to simulate the exact, mathematically true $\Delta$ CO₂e reduction. 
* **The ML Ranker:** It then passes these exact calculations through our custom ML Ranker, which evaluates feasibility, tier-specific constraints, and impact to surface the absolute best recommendations to the top.

```mermaid
flowchart LR
<<<<<<< Updated upstream
    A[ Supplier Data\nCSV / Manual / Demo] --> B[ Carbon Engine\nActivity × Emission Factor]
    B --> C[ Dashboard\nHotspots · Rankings · Trends]
    B --> D[ Model A\nEnergy Estimation]
    B --> E[ Model B\nSourcing Recommendation]
    D --> C
    E --> F[ Circular Sourcing\nSuggestions + Δ CO₂e]
=======
    A[📥 Supplier Data Ingestion] --> B[⚙️ Carbon Engine\nStrict Math: Activity × Factor]
    B --> C[📊 React Dashboard\nGeospatial Map & KPIs]
    B --> D[🤖 Model A\nPeer-Group Data Imputation]
    B --> E[🔁 Model B\nRecommendation Generator]
    D --> C
    E --> F[🌍 Exact Scenario Simulation]
>>>>>>> Stashed changes
    F --> C
```

---

<<<<<<< Updated upstream
<<<<<<< HEAD
##  Preview
=======
## Password reset email (local development)

The backend can send real password-reset emails through Gmail SMTP. Copy
`backend/.env.example` to `backend/.env`, set `SMTP_USERNAME` and a Gmail
**App Password** (not your normal Google password), then start the backend.
The backend loads that local file automatically. Never commit or share
`backend/.env`.

For Gmail delivery, Carbonix always uses the authenticated `SMTP_USERNAME` as
the sender address. This lets Gmail attach its DKIM signature; do not set a
different address as the sender.

Reset links use `FRONTEND_URL` and expire after 30 minutes. The link can be
used only once.

## ML Benchmarks
>>>>>>> 97f430b (Added forgot password mail functionality)

> *Drop in actual product screenshots or a demo GIF here — e.g.:*

```
![Dashboard Overview](./assets/dashboard-overview.png)
![Hotspot Map](./assets/hotspot-map.png)
![Scenario Simulator](./assets/scenario-simulator.png)
```

| View | What it shows |
|---|---|
|  Dashboard | Total CO₂e, emissions by supplier/tier/category, live hotspots |
|  Hotspot Map | Suppliers plotted geographically, node size = emissions |
|  Scenario Simulator | Slide recycled %, renewable %, rail % → see projected CO₂e drop |
|  Supplier Ranking | Leaderboard by total CO₂e, intensity, and carbon risk |
=======
## ✨ Full Feature Breakdown

- **Supply Chain Hierarchy Mapping:** Visual network tree showing exact dependencies across Tiers 1, 2, and 3.
- **MapLibre Geospatial Hotspot Map:** Interactive heatmap plotting suppliers geographically, dynamically weighted by their computed emissions.
- **Deterministic Carbon Calculator:** Computes CO₂e natively across energy, transport, material, and manufacturing.
- **AI Circular Sourcing Recommendations:** AI-ranked actionable sourcing alternatives simulating exact CO₂e reduction (e.g., virgin → recycled materials).
- **What-If Scenario Simulator:** Interactive sliders to adjust recycled material %, renewable energy %, and rail transport % to instantly project supply chain improvements.
- **Supply Chain Chatbot:** A built-in chat interface for conversational querying of dataset insights.
- **Emission Factor Database:** Configurable library of carbon factors for various materials (steel, aluminium, plastic), grid energy sources, and transport modes.
- **ESG Audit Report Export:** Instantly compile and download a COP28 & ISSB S2 compliant PDF executive summary.
>>>>>>> Stashed changes

---

##  Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Recharts, React Flow, MapLibre GL |
| **Backend** | FastAPI, Pydantic, Python |
| **Database** | SQLite (default), PostgreSQL ready, SQLAlchemy, Alembic |
| **Data & ML** | Scikit-learn, Custom Peer-Group Estimators, ML Rankers |

---

##  Benchmark Results (Live Run)

The backend and ML systems are strictly tested against baselines to validate real-world readiness:

| Component | Metric | Model / System | Baseline | Result |
|---|---|---|---|---|
| **Model A** | MAE (energy_kwh) | 5,556 kWh | 13,733 kWh | ✅ **−60% Error** |
| **Model A** | Inference Latency | 0.030 ms | — | ✅ |
| **Model B** | NDCG@3 | 0.9996 | 0.9937 | ✅ |
| **Model B** | Top-1 Accuracy | 97.67% | 93.02% | ✅ **+4.7 pp** |
| **Carbon Engine**| Golden/Invariant Tests | 54/54 passed | N/A | ✅ **Perfectly Auditable** |
| **Carbon Engine**| Evaluation Latency | ~0.035 ms/call | — | ✅ |

---

##  Get it running locally now !

### Prerequisites

- Python 3.9+
- Node.js & npm

### Backend

```powershell
cd backend
..\.venv\Scripts\python.exe -m pip install -e "."
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

*Note: The backend creates and seeds the default local SQLite database at startup. API documentation is available at `http://127.0.0.1:8000/docs`.*

### Frontend

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

*Open `http://127.0.0.1:5173/` in your browser. The app defaults to using the local API.*

---

## 👨‍💻 Team

Built at **DAU HackOut'26** by:

- Palash Kulkarni
- Khush Patel
- Anvesh Anand Pol
- Harshil Dhameliya

---

<div align="center">

**Carbonix** — making Scope 3 emissions visible, auditable, and actionable. 🌍

</div>
