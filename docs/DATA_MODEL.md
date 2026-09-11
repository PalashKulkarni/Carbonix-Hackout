# Data model (PostgreSQL)

Match column names to `docs/GLOSSARY.md`. UUIDs stored as strings (or UUID type) with the prefixes in the glossary for **demo seed only**; production can be raw UUIDs as strings.

## `orgs`

| Column | Type |
|---|---|
| `org_id` | PK |
| `name` | text |

Demo: `org_apex`, Apex Manufacturing.

## `users`

| Column | Type |
|---|---|
| `user_id` | PK |
| `org_id` | FK |
| `email` | text unique |
| `password_hash` | text nullable (demo user may skip) |
| `is_demo` | bool |

## `suppliers`

| Column | Type |
|---|---|
| `supplier_id` | PK |
| `org_id` | FK |
| `parent_id` | FK suppliers, nullable |
| `name` | text |
| `tier` | int |
| `material_code` | text |
| `material_quantity_kg` | numeric |
| `energy_kwh` | numeric |
| `electricity_source` | text |
| `transport_distance_km` | numeric |
| `transport_mode` | text |
| `location_label` | text |
| `latitude` | numeric |
| `longitude` | numeric |
| `production_volume` | numeric |
| `production_unit` | text |
| `data_source` | text |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

Constraints: `tier` in (1,2,3); if `tier=1` then `parent_id` is null; if `tier>1` then `parent_id` is required.

## `emission_factors`

| Column | Type |
|---|---|
| `factor_id` | PK |
| `org_id` | FK nullable (null = global default) |
| `factor_category` | text |
| `code` | text |
| `factor_kg_co2e_per_unit` | numeric |
| `unit` | text (`kg`, `kwh`, `tonne_km`, `unit_output`) |
| `source` | text |
| `year` | int |

Unique: `(org_id, factor_category, code)` with null org = global.

## `emission_results`

Cached output of the engine. Recalculate on supplier save, CSV, factor edit, demo load.

| Column | Type |
|---|---|
| `supplier_id` | PK/FK |
| `period` | text |
| `energy_co2e_kg` | numeric |
| `transport_co2e_kg` | numeric |
| `material_co2e_kg` | numeric |
| `manufacturing_co2e_kg` | numeric |
| `logistics_co2e_kg` | numeric |
| `total_co2e_kg` | numeric |
| `intensity_kg_per_unit` | numeric |
| `carbon_risk` | text |
| `rank` | int |
| `calculated_at` | timestamptz |

## `recommendations`

| Column | Type |
|---|---|
| `recommendation_id` | PK |
| `org_id` | FK |
| `supplier_id` | FK |
| `action_type` | text |
| `title` | text |
| `description` | text |
| `current_co2e_kg` | numeric |
| `projected_co2e_kg` | numeric |
| `delta_co2e_kg` | numeric |
| `status` | text |
| `created_at` | timestamptz |

`delta_co2e_kg` = `current_co2e_kg - projected_co2e_kg` (positive = reduction). Always from engine, not from Model B alone.

## `scenarios` (optional save)

| Column | Type |
|---|---|
| `scenario_id` | PK |
| `org_id` | FK |
| `name` | text |
| `recycled_material_pct` | numeric |
| `renewable_energy_pct` | numeric |
| `rail_transport_pct` | numeric |
| `current_total_co2e_kg` | numeric |
| `projected_total_co2e_kg` | numeric |
| `created_at` | timestamptz |

## `emission_snapshots` (P2 trends)

Monthly org rollup. Skip table until P2; trends endpoint may return empty list.

## Relationships

```
orgs 1──* suppliers (tree via parent_id)
orgs 1──* emission_factors
suppliers 1──1 emission_results (per period)
suppliers 1──* recommendations
```
