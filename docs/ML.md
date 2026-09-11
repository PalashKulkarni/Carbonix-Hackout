# ML modules

Two modules in `backend/ml/`. They **do not replace** `backend/engine/`.

## Model A — activity gap-fill

**When:** CSV/manual row has zeros/nulls for `energy_kwh`, `transport_distance_km`, `material_quantity_kg`, or `production_volume`, but other fields exist.

**In** (`GapFillRequest`): supplier activity fields as in glossary (some null).

**Out** (`GapFillResponse`):

```json
{
  "supplier_id": "sup_steelco",
  "filled_fields": ["energy_kwh"],
  "energy_kwh": 48000,
  "material_quantity_kg": null,
  "transport_distance_km": null,
  "production_volume": null,
  "data_source": "modeled",
  "confidence": 0.62
}
```

Only include keys that were filled. Backend writes those fields, sets `data_source` to `modeled` or `mixed`, then **runs the engine**.

**v1 acceptable:** peer-group mean by `material_code` + `tier` (no GPU). sklearn/LightGBM later.

**Forbidden:** returning `total_co2e_kg` as Model A’s primary output.

## Model B — rank alternatives

**When:** `GET /recommendations` or per-supplier recs. Candidate **types** are fixed enums.

**Catalog (always consider these if they apply):**

| `action_type` | Meaning |
|---|---|
| `recycled_material` | Virgin → recycled for `material_code` |
| `low_carbon_material` | e.g. steel → lower-factor alloy / alternative code |
| `renewable_energy` | `grid_coal` / `grid_mixed` → `grid_renewable` or `onsite_solar` |
| `modal_shift` | `air`/`road` → `rail` or `sea` |
| `local_sourcing` | Cut `transport_distance_km` (demo: × 0.3) |
| `alternative_supplier` | Point to another demo supplier with same `material_code` and lower intensity |

**Scoring:** For each candidate, backend clones activity, applies the change, runs **engine**, sets `delta_co2e_kg`. Model B only **orders** candidates (feasibility, confidence). Drop deltas &lt; 1% of supplier total.

**Out:** array of `Recommendation` objects — same shape as `fixtures/recommendations.json`.

**v1 acceptable:** rule scores (renewable if coal; modal_shift if air/road; recycled always for steel/aluminium/plastic). ML ranker when labels exist.

**LLM:** P2 chatbot only. Tools call existing GET APIs. LLM must not invent tonnes.

## Shared with frontend

UI never calls Model A/B URLs. Only FastAPI:

- Gap-fill is internal on ingest
- Recs: `GET /recommendations` and `GET /suppliers/{id}/recommendations`
