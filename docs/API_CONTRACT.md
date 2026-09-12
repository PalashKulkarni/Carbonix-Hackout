# API contract

Base URL (dev): `http://localhost:8000`

All JSON camelCase? **No. Use snake_case everywhere** (glossary names).

Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`.

Query `period` default `2025`.

List responses: `{ "items": [...], "total": N }` unless noted.

Error: `{ "error": { "code": string, "message": string, "details": [] } }`

Codes: `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`.

Frontend: until the API is up, import `fixtures/*.json` as the response `body` (or `items` where listed).

---

## Auth

### `POST /auth/demo`

Body: `{}`  
Response:

```json
{
  "token": "demo-token-apex",
  "org_id": "org_apex",
  "org_name": "Apex Manufacturing",
  "email": "demo@apex.example"
}
```

### `POST /auth/signup`

Body: `{ "email": string, "password": string, "org_name": string }`

Response: same shape as `/auth/demo`, with a newly created `org_id` and signed bearer token. Passwords are hashed before storage.

### `POST /auth/login`

Body: `{ "email": string, "password": string }`

Response: same shape as demo login. Invalid credentials return `401 UNAUTHORIZED`.

### `GET /auth/me`

Requires `Authorization: Bearer <token>`.

Response: `{ "org_id", "org_name", "email" }`

All non-public API routes require the same bearer header. Public routes are health, demo login, signup, login, and API documentation.

---

## Suppliers

### `GET /suppliers?period=&tier=&carbon_risk=`

Each item = supplier activity **plus** emission summary fields (`total_co2e_kg`, five buckets, `intensity_kg_per_unit`, `carbon_risk`, `rank`, `data_source`).

Golden: `fixtures/suppliers.json`

### `GET /suppliers/{supplier_id}`

One object, same shape as a list item. 404 if missing.

### `POST /suppliers`

Body: activity fields only (no computed CO₂e). Required: `name`, `tier`, `material_code`, `location_label`, `latitude`, `longitude`. Numbers default 0.

Response: full supplier+emissions (engine run; Model A if activity empty).

### `PUT /suppliers/{supplier_id}`

Partial activity update. Recalculate. Response: full object.

### `POST /suppliers/upload`

`multipart/form-data` field `file` (CSV). Columns: `docs/CSV_FORMAT.md`.  
Response: `{ "created": n, "updated": n, "errors": [ { "row": 2, "message": "..." } ], "items": [ ...same as list items... ] }`

### `POST /suppliers/demo`

Wipes org suppliers and reseeds from fixtures. Response: `GET /suppliers` shape.

---

## Emissions / dashboard

### `GET /suppliers/{supplier_id}/emissions?period=`

Golden: one element of `fixtures/emissions.json` (`by_supplier` entry).

### `GET /dashboard?period=`

Golden: `fixtures/dashboard.json`

### `GET /rankings?period=&sort=total|intensity`

`sort` default `total`. Items: `supplier_id`, `name`, `rank`, `total_co2e_kg`, `intensity_kg_per_unit`, `carbon_risk`.  
Golden: `fixtures/rankings.json`

---

## Hierarchy

### `GET /hierarchy?period=`

```json
{
  "org_id": "org_apex",
  "org_name": "Apex Manufacturing",
  "total_co2e_kg": 0,
  "children": [
    {
      "supplier_id": "sup_steelco",
      "name": "",
      "tier": 1,
      "total_co2e_kg": 0,
      "carbon_risk": "high",
      "children": []
    }
  ]
}
```

Golden: `fixtures/hierarchy.json`

---

## Map (P1)

### `GET /map/suppliers?period=`

Items: `supplier_id`, `name`, `latitude`, `longitude`, `total_co2e_kg`, `carbon_risk`, `tier`.  
Golden: `fixtures/map-suppliers.json`

---

## Recommendations (P1)

### `GET /recommendations?period=&supplier_id=`

Golden: `fixtures/recommendations.json`

### `GET /suppliers/{supplier_id}/recommendations`

`{ "items": [...], "total": n }` filtered to that supplier.

### `PATCH /recommendations/{recommendation_id}`

Body: `{ "status": "open"|"accepted"|"dismissed"|"in_progress" }`  
Response: one recommendation.

---

## Scenarios (P1)

### `POST /scenarios/simulate`

Body:

```json
{
  "period": "2025",
  "recycled_material_pct": 40,
  "renewable_energy_pct": 60,
  "rail_transport_pct": 50
}
```

Response golden: `fixtures/scenario-result.json`

---

## Factors

### `GET /factors`

Golden: `fixtures/factors.json` (`items` wrapper).

### `PUT /factors/{factor_id}`

Body: `{ "factor_kg_co2e_per_unit": number, "source": string, "year": number }`  
Response: one factor. Then recalc all `emission_results`.

---

## Reports (P2)

### `POST /reports/esg`

Body: `{ "period": "2025", "scenario_id": null }`  
Response: `application/pdf` or `{ "url": string }` — pick PDF bytes in P2. Frontend: download button only.

---

## Chat (P2)

### `POST /chat`

Body: `{ "messages": [ { "role": "user"|"assistant", "content": string } ], "period": "2025" }`  
Response: `{ "role": "assistant", "content": string }`  
Tools may only call existing GET endpoints. No extra undocumented routes.

---

## Frontend mock map

| Page | Fixture file |
|---|---|
| Dashboard | `dashboard.json` |
| Suppliers list | `suppliers.json` |
| Detail / emissions | `suppliers.json` + `emissions.json` |
| Hierarchy | `hierarchy.json` |
| Map | `map-suppliers.json` |
| Recs | `recommendations.json` |
| Scenarios | `scenario-result.json` |
| Factors | `factors.json` |
| Rankings widget | `rankings.json` |
