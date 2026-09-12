from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from engine.carbon import calculate_emissions, calculate_rankings
from app.models import EmissionFactor, EmissionResult, Supplier


def supplier_activity(supplier: Supplier) -> dict[str, object]:
    return {
        "material_quantity_kg": supplier.material_quantity_kg,
        "energy_kwh": supplier.energy_kwh,
        "electricity_source": supplier.electricity_source,
        "transport_distance_km": supplier.transport_distance_km,
        "transport_mode": supplier.transport_mode,
        "material_code": supplier.material_code,
        "production_volume": supplier.production_volume,
    }


def calculate_and_rank(database: Session, period: str) -> None:
    rows = []
    suppliers = database.scalars(select(Supplier)).all()
    factors = {
        (factor.factor_category, factor.code): float(factor.factor_kg_co2e_per_unit)
        for factor in database.scalars(select(EmissionFactor)).all()
    }
    for supplier in suppliers:
        rows.append({"supplier_id": supplier.supplier_id, **calculate_emissions(supplier_activity(supplier), factors)})
    ranked = calculate_rankings(rows)
    database.execute(delete(EmissionResult).where(EmissionResult.period == period))
    for row in ranked:
        database.add(EmissionResult(supplier_id=row["supplier_id"], period=period, **{key: row[key] for key in (
            "energy_co2e_kg", "transport_co2e_kg", "material_co2e_kg", "manufacturing_co2e_kg",
            "logistics_co2e_kg", "total_co2e_kg", "intensity_kg_per_unit", "carbon_risk", "rank",
        )}))
