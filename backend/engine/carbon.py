from __future__ import annotations

from statistics import median
from typing import Any

BUCKETS = ("energy", "transport", "material", "manufacturing", "logistics")


def _factor(factors: dict[tuple[str, str], float], category: str, code: str, fallback: str) -> float:
    return factors.get((category, code), factors[(category, fallback)])


def calculate_emissions(
    supplier: dict[str, Any],
    factors: dict[tuple[str, str], float],
) -> dict[str, float]:
    tonnes = float(supplier.get("material_quantity_kg") or 0) / 1000
    energy = float(supplier.get("energy_kwh") or 0) * _factor(
        factors, "energy", supplier.get("electricity_source") or "grid_mixed", "grid_mixed"
    )
    transport_activity = tonnes * float(supplier.get("transport_distance_km") or 0)
    transport = transport_activity * _factor(
        factors, "transport", supplier.get("transport_mode") or "road", "road"
    )
    material = float(supplier.get("material_quantity_kg") or 0) * _factor(
        factors, "material", supplier.get("material_code") or "other", "other"
    )
    material_code = supplier.get("material_code") or "other"
    manufacturing = float(supplier.get("production_volume") or 0) * _factor(
        factors, "manufacturing", f"mfg_{material_code}", "mfg_other"
    )
    logistics = tonnes * 50 * _factor(factors, "logistics", "logistics_road", "logistics_road")
    values = {
        "energy_co2e_kg": energy,
        "transport_co2e_kg": transport,
        "material_co2e_kg": material,
        "manufacturing_co2e_kg": manufacturing,
        "logistics_co2e_kg": logistics,
    }
    total = sum(values.values())
    volume = float(supplier.get("production_volume") or 0)
    values["total_co2e_kg"] = total
    values["intensity_kg_per_unit"] = total / volume if volume else 0
    return values


def calculate_risk(
    emissions: dict[str, float],
    org_median_intensity: float,
    org_total: float,
) -> str:
    total = emissions["total_co2e_kg"]
    intensity = emissions["intensity_kg_per_unit"]
    if org_total and total / org_total >= 0.15:
        return "high"
    if not org_median_intensity:
        return "medium"
    if intensity < 0.8 * org_median_intensity:
        return "low"
    if intensity > 1.25 * org_median_intensity:
        return "high"
    return "medium"


def calculate_rankings(emission_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ordered = sorted(emission_rows, key=lambda row: row["total_co2e_kg"], reverse=True)
    intensities = [row["intensity_kg_per_unit"] for row in ordered if row["intensity_kg_per_unit"] > 0]
    org_median = median(intensities) if intensities else 0
    org_total = sum(row["total_co2e_kg"] for row in ordered)
    for rank, row in enumerate(ordered, start=1):
        row["rank"] = rank
        row["carbon_risk"] = calculate_risk(row, org_median, org_total)
    return ordered
