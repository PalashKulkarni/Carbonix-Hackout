# Glossary — freeze these names

Never rename these in UI, API, DB, or ML without updating this file, `API_CONTRACT.md`, and `fixtures/`.

## IDs

| Name | Type | Notes |
|---|---|---|
| `org_id` | string | Buyer company. Demo: `org_apex` |
| `supplier_id` | string | Prefix `sup_`. Demo IDs in `fixtures/demo-ids.md` |
| `factor_id` | string | Prefix `fac_` |
| `recommendation_id` | string | Prefix `rec_` |
| `scenario_id` | string | Prefix `scn_` |
| `reset_token_id` | string | Prefix `prt_`. Internal identifier for one-time password reset records |
| `parent_id` | string \| null | Supplier’s parent. `null` = Tier 1 reporting to the org |

## Enums

### `tier`

`1` | `2` | `3` (integer, not `"T1"`).

### `material_code`

`steel` | `aluminium` | `plastic` | `cement` | `other`

### `electricity_source`

`grid_coal` | `grid_mixed` | `grid_renewable` | `onsite_solar`

### `transport_mode`

`road` | `rail` | `sea` | `air`

### `emission_category`

`energy` | `transport` | `material` | `manufacturing` | `logistics`

### `factor_category`

`material` | `energy` | `transport` | `manufacturing` | `logistics`

### `carbon_risk`

`low` | `medium` | `high`

Thresholds (engine, not ML): intensity vs org median — `low` &lt; 0.8× median, `high` &gt; 1.25× median, else `medium`. Also `high` if that supplier is ≥ 15% of org total CO₂e.

### `data_source`

`primary` | `modeled` | `mixed`

- `primary`: user/CSV provided the activity
- `modeled`: Model A filled at least one activity field
- `mixed`: some primary, some modeled

### `recommendation_action_type`

`recycled_material` | `low_carbon_material` | `renewable_energy` | `modal_shift` | `local_sourcing` | `alternative_supplier`

### `recommendation_status`

`open` | `accepted` | `dismissed` | `in_progress`

## Units (always these)

| Field | Unit |
|---|---|
| Mass | `kg` |
| Energy | `kWh` |
| Distance | `km` |
| Freight activity | `tonne_km` (tonnes × km) |
| Emissions | `co2e_kg` (kilograms CO₂e, not tonnes in the API) |
| Production volume | number + `production_unit` string (`tonnes` for demo) |

UI may **display** tonnes (divide by 1000) but JSON stays `co2e_kg`.

## Core computed fields

| Field | Meaning |
|---|---|
| `energy_co2e_kg` | Electricity/fuel |
| `transport_co2e_kg` | Inbound freight for this supplier |
| `material_co2e_kg` | Embodied material |
| `manufacturing_co2e_kg` | Process / production energy beyond billed kWh split |
| `logistics_co2e_kg` | Warehousing / last-mile bucket (see engine doc) |
| `total_co2e_kg` | Sum of the five categories |
| `intensity_kg_per_unit` | `total_co2e_kg / production_volume` (0 if volume is 0) |
| `rank` | 1 = highest `total_co2e_kg` in the org |

## Activity fields (inputs)

| Field | Type |
|---|---|
| `name` | string |
| `tier` | 1\|2\|3 |
| `parent_id` | string \| null |
| `material_code` | enum |
| `material_quantity_kg` | number ≥ 0 |
| `energy_kwh` | number ≥ 0 |
| `electricity_source` | enum |
| `transport_distance_km` | number ≥ 0 |
| `transport_mode` | enum |
| `location_label` | string (city, country) |
| `latitude` | number |
| `longitude` | number |
| `production_volume` | number ≥ 0 |
| `production_unit` | string |

## Date / period

- `period` query: `YYYY` (calendar year) or `last_12m`
- Default: `2025`
- Timestamps: ISO-8601 UTC (`2025-06-01T00:00:00Z`)

## Password reset fields

| Field | Type | Meaning |
|---|---|---|
| `token` | string | Opaque one-time credential in the reset URL. Never store or return it after creation. |
| `token_hash` | string | SHA-256 hash of the reset token, stored server-side. |
| `expires_at` | timestamp | Token expiry; password reset tokens expire after 30 minutes. |
| `used_at` | timestamp \| null | Set once the token is consumed or superseded by a newer reset request. |
