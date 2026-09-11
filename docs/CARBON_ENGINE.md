# Carbon engine

**Official CO₂e is never predicted by ML.** Implement in `backend/engine/` as pure functions. Same functions are used for live inventory, ranking, what-if, and recommendation deltas.

## Formula

```
co2e_kg = activity × factor_kg_co2e_per_unit
```

## Five buckets

Let `t` = `material_quantity_kg / 1000` (tonnes of goods, for freight).

| Bucket | Activity | Factor `code` | Unit |
|---|---|---|---|
| `energy` | `energy_kwh` | `electricity_source` (`grid_coal`, …) | kWh |
| `transport` | `t * transport_distance_km` (tonne_km) | `transport_mode` | tonne_km |
| `material` | `material_quantity_kg` | `material_code` | kg |
| `manufacturing` | `production_volume` | `mfg_{material_code}` | unit_output |
| `logistics` | `t * 50` (assumed 50 km last-mile) | `logistics_road` | tonne_km |

If a factor is missing, use `other` / `grid_mixed` / `road` fallbacks and set `data_source` to `mixed` if it was `primary`.

## Totals

```
total_co2e_kg = energy + transport + material + manufacturing + logistics
intensity_kg_per_unit = total / production_volume   # 0 if volume is 0
```

## Ranking

Sort suppliers in the org by `total_co2e_kg` descending. `rank` starts at 1.

## Carbon risk

1. Org median of `intensity_kg_per_unit` (ignore zeros).
2. `low` if intensity &lt; 0.8 × median; `high` if &gt; 1.25 × median; else `medium`.
3. Override to `high` if `total_co2e_kg / org_total ≥ 0.15`.

## What-if (P1)

Apply sliders **before** calling the same bucket math:

- `recycled_material_pct`: material factor blended toward `recycled_{material_code}` (if missing, `material_factor * 0.4` as stand-in).
- `renewable_energy_pct`: energy factor blended toward `grid_renewable`.
- `rail_transport_pct`: that fraction of tonne_km uses `rail` instead of current mode.

Return current totals, projected totals, `delta_co2e_kg`, `delta_pct`.

## Recalculate when

- Supplier create/update
- CSV upload
- Demo seed
- Factor PUT
- After Model A writes estimated activity

## Tests the backend must have

Golden: `fixtures/emissions.json` totals for `sup_steelco` must match engine output with `fixtures/factors.json`.
