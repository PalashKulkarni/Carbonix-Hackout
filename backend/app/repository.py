from __future__ import annotations

from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.data import load_fixture
from app.engine_adapter import calculate_and_rank
from app.models import EmissionFactor, EmissionResult, Org, Supplier, User

ORG_ID = "org_apex"
PERIOD = "2025"


SUPPLIER_FIELDS = (
    "supplier_id", "org_id", "parent_id", "name", "tier", "material_code",
    "material_quantity_kg", "energy_kwh", "electricity_source", "transport_distance_km",
    "transport_mode", "location_label", "latitude", "longitude", "production_volume",
    "production_unit", "data_source",
)


def seed_demo(database: Session) -> list[dict[str, Any]]:
    database.execute(delete(EmissionResult))
    database.execute(delete(Supplier))
    database.execute(delete(EmissionFactor))
    database.execute(delete(User))
    database.execute(delete(Org))

    database.add(Org(org_id=ORG_ID, name="Apex Manufacturing"))
    database.add(User(user_id="usr_demo", org_id=ORG_ID, email="demo@apex.example", is_demo=True))

    factor_items = load_fixture("factors.json")["items"]
    database.add_all([EmissionFactor(**item) for item in factor_items])
    supplier_items = load_fixture("suppliers.json")["items"]
    database.add_all([Supplier(**{key: item[key] for key in SUPPLIER_FIELDS}) for item in supplier_items])
    database.flush()

    calculate_and_rank(database, PERIOD)
    database.commit()
    return supplier_items


def factor_map(database: Session) -> dict[tuple[str, str], float]:
    return {
        (factor.factor_category, factor.code): float(factor.factor_kg_co2e_per_unit)
        for factor in database.scalars(select(EmissionFactor)).all()
    }


def supplier_dict(supplier: Supplier, result: EmissionResult | None) -> dict[str, Any]:
    data = {key: getattr(supplier, key) for key in SUPPLIER_FIELDS}
    if result:
        data.update({
            "energy_co2e_kg": float(result.energy_co2e_kg),
            "transport_co2e_kg": float(result.transport_co2e_kg),
            "material_co2e_kg": float(result.material_co2e_kg),
            "manufacturing_co2e_kg": float(result.manufacturing_co2e_kg),
            "logistics_co2e_kg": float(result.logistics_co2e_kg),
            "total_co2e_kg": float(result.total_co2e_kg),
            "intensity_kg_per_unit": float(result.intensity_kg_per_unit),
            "carbon_risk": result.carbon_risk,
            "rank": result.rank,
        })
    return data


def all_supplier_dicts(database: Session, period: str = PERIOD) -> list[dict[str, Any]]:
    suppliers = database.scalars(select(Supplier)).all()
    results = {result.supplier_id: result for result in database.scalars(select(EmissionResult).where(EmissionResult.period == period)).all()}
    items = [supplier_dict(supplier, results.get(supplier.supplier_id)) for supplier in suppliers]
    return sorted(items, key=lambda item: item.get("rank", 0))


def initialize_database(database: Session) -> None:
    if database.scalar(select(Supplier.supplier_id).limit(1)) is None:
        seed_demo(database)
