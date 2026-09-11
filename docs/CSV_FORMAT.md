# CSV format

`POST /suppliers/upload` — UTF-8, header row required, comma-separated.

## Columns (exact header names)

| Header | Required | Maps to |
|---|---|---|
| `name` | yes | `name` |
| `tier` | yes | `tier` (1, 2, or 3) |
| `parent_name` | if tier &gt; 1 | resolved to `parent_id` (must already exist or appear earlier in the file) |
| `material_code` | yes | enum |
| `material_quantity_kg` | no | default 0 |
| `energy_kwh` | no | default 0 |
| `electricity_source` | no | default `grid_mixed` |
| `transport_distance_km` | no | default 0 |
| `transport_mode` | no | default `road` |
| `location_label` | yes | |
| `latitude` | yes | |
| `longitude` | yes | |
| `production_volume` | no | default 0 |
| `production_unit` | no | default `tonnes` |

Example row: `fixtures/suppliers.csv`.

Empty numeric cells → Model A may fill, then `data_source=modeled`.
