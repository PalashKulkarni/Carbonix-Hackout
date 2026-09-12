from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

try:
    from engine import FactorRegistry, SupplierActivityInput, calculate_org_emissions
    from engine.models import EmissionFactor as EngineEmissionFactor
except ModuleNotFoundError:
    from backend.engine import FactorRegistry, SupplierActivityInput, calculate_org_emissions
    from backend.engine.models import EmissionFactor as EngineEmissionFactor
from app.models import EmissionFactor, EmissionResult, Supplier


def supplier_activity(supplier: Supplier) -> SupplierActivityInput:
    return SupplierActivityInput(
        supplier_id=supplier.supplier_id,
        org_id=supplier.org_id,
        parent_id=supplier.parent_id,
        name=supplier.name,
        tier=supplier.tier,
        material_code=supplier.material_code,
        material_quantity_kg=float(supplier.material_quantity_kg),
        energy_kwh=float(supplier.energy_kwh),
        electricity_source=supplier.electricity_source,
        transport_distance_km=float(supplier.transport_distance_km),
        transport_mode=supplier.transport_mode,
        location_label=supplier.location_label,
        latitude=float(supplier.latitude),
        longitude=float(supplier.longitude),
        production_volume=float(supplier.production_volume),
        production_unit=supplier.production_unit,
        data_source=supplier.data_source,
    )


def factor_registry(database: Session) -> FactorRegistry:
    factors = [
        EngineEmissionFactor(
            factor_id=factor.factor_id,
            org_id=factor.org_id,
            factor_category=factor.factor_category,
            code=factor.code,
            factor_kg_co2e_per_unit=float(factor.factor_kg_co2e_per_unit),
            unit=factor.unit,
            source=factor.source,
            year=factor.year,
        )
        for factor in database.scalars(select(EmissionFactor)).all()
    ]
    return FactorRegistry(factors=factors)


def calculate_and_rank(database: Session, period: str) -> None:
    suppliers = database.scalars(select(Supplier)).all()
    activities = [supplier_activity(supplier) for supplier in suppliers]
    ranked = calculate_org_emissions(
        activities,
        registry=factor_registry(database),
        period=period,
    )
    database.execute(delete(EmissionResult).where(EmissionResult.period == period))
    for row in ranked:
        database.add(EmissionResult(supplier_id=row.supplier_id, period=period, **{key: getattr(row, key) for key in (
            "energy_co2e_kg", "transport_co2e_kg", "material_co2e_kg", "manufacturing_co2e_kg",
            "logistics_co2e_kg", "total_co2e_kg", "intensity_kg_per_unit", "carbon_risk", "rank",
        )}))
