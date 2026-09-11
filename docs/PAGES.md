# Pages — routes and what lives on each

Frontend **must** use these React Router paths. Sidebar labels in quotes.

## Public

| Path | Page | Contains |
|---|---|---|
| `/` | Landing | Hero, Scope 3 problem, ingest→calc→hotspots→recs, feature grid, CTA to `/login` |
| `/login` | Login | Email/password (can be stubbed), **Demo login** button → `POST /auth/demo` → `/app` |

## App shell

All `/app/*` routes: left sidebar, top bar (title + `period` filter), logout. Chat overlay (P2) on every app page — **not** a sidebar item.

Sidebar order:

1. Dashboard → `/app`
2. Suppliers → `/app/suppliers`
3. Hierarchy → `/app/hierarchy`
4. Map → `/app/map`
5. Recommendations → `/app/recommendations`
6. Scenarios → `/app/scenarios`
7. Factors → `/app/factors`
8. Trends → `/app/trends`
9. Reports → `/app/reports`

## App pages

### `/app` — Dashboard (P0)

- KPIs: `total_co2e_kg`, `supplier_count`, `data_coverage_pct`, `tier1_share_pct`
- Chart: emissions by `emission_category`
- Chart: emissions by `tier`
- Hotspots table: top 5 suppliers by `total_co2e_kg` → `/app/suppliers/:supplier_id`
- Ranking snapshot: top 5 by `intensity_kg_per_unit` / `carbon_risk`
- Map teaser (P1): link to `/app/map`
- Recs teaser (P1): top 3 `delta_co2e_kg` → `/app/recommendations`
- API: `GET /dashboard?period=`

### `/app/suppliers` — List + ingest (P0)

- Upload CSV, Add supplier, Load demo
- Table: `rank`, `name`, `tier`, `material_code`, `location_label`, `total_co2e_kg`, `intensity_kg_per_unit`, `carbon_risk`
- Sort/filter: tier, risk, emissions
- Row click → detail
- APIs: `GET /suppliers`, `POST /suppliers`, `POST /suppliers/upload`, `POST /suppliers/demo`

### `/app/suppliers/:supplier_id` — Detail (P0)

**Not in sidebar.**

- Header: name, tier, location, total, risk, `data_source`
- Five-category breakdown
- Activity fields (editable)
- Recs for this supplier (P1)
- Links: map, hierarchy
- APIs: `GET /suppliers/{id}`, `PUT /suppliers/{id}`, `GET /suppliers/{id}/emissions`, `GET /suppliers/{id}/recommendations`

### `/app/hierarchy` — Tree (P0)

- Org root → tier 1 → 2 → 3 (React Flow)
- Node color/size by `total_co2e_kg`
- Click → detail
- API: `GET /hierarchy?period=`

### `/app/map` — Hotspot map (P1)

- MapLibre pins: `latitude`, `longitude`, size = CO₂e, color = `carbon_risk`
- Click → popup + detail
- API: `GET /map/suppliers?period=`

### `/app/recommendations` — Actions inbox (P1)

- List: action type, supplier, `delta_co2e_kg`, status
- API: `GET /recommendations?period=`

### `/app/scenarios` — What-if (P1)

- Sliders: `recycled_material_pct`, `renewable_energy_pct`, `rail_transport_pct` (0–100)
- Show current vs projected vs `delta_co2e_kg` vs `delta_pct`
- API: `POST /scenarios/simulate`

### `/app/factors` — Factor DB (P0)

- Tabs by `factor_category`
- Edit `factor_kg_co2e_per_unit`, `unit`, `source`, `year`
- APIs: `GET /factors`, `PUT /factors/{id}`
- After edit, backend recalculates org emissions

### `/app/trends` — History (P2)

- Lines: total, by category, by tier
- API: `GET /trends`

### `/app/reports` — ESG PDF (P2)

- Preview + download
- API: `POST /reports/esg`

## Not pages

| Feature | Where |
|---|---|
| Calculator | Engine on ingest/save; numbers on dashboard + detail |
| Ranking / hotspots | Dashboard + suppliers table + map |
| Chatbot | Overlay; `POST /chat` |
