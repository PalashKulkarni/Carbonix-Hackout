from __future__ import annotations

from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.data import load_fixture
from app.engine_adapter import calculate_and_rank
from app.models import EmissionFactor, EmissionResult, Org, Supplier, User
from app.recommendations import refresh_recommendations

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
    refresh_recommendations(database, PERIOD)
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


def dashboard(database: Session, period: str = PERIOD) -> dict[str, Any]:
    items = all_supplier_dicts(database, period)
    categories = {
        category: sum(item[f"{category}_co2e_kg"] for item in items)
        for category in ("energy", "transport", "material", "manufacturing", "logistics")
    }
    tiers = {
        tier: sum(item["total_co2e_kg"] for item in items if item["tier"] == tier)
        for tier in (1, 2, 3)
    }
    total = sum(item["total_co2e_kg"] for item in items)
    tier1_total = tiers[1]
    return {
        "period": period,
        "org_id": ORG_ID,
        "org_name": "Apex Manufacturing",
        "total_co2e_kg": total,
        "supplier_count": len(items),
        "data_coverage_pct": 100 if items else 0,
        "tier1_share_pct": tier1_total / total * 100 if total else 0,
        "by_category": [
            {"emission_category": category, "co2e_kg": value}
            for category, value in categories.items()
        ],
        "by_tier": [{"tier": tier, "co2e_kg": tiers[tier]} for tier in (1, 2, 3)],
        "hotspots": [
            {key: item[key] for key in ("supplier_id", "name", "total_co2e_kg", "carbon_risk", "rank")}
            for item in items[:5]
        ],
        "ranking_snapshot": [
            {key: item[key] for key in ("supplier_id", "name", "intensity_kg_per_unit", "carbon_risk")}
            for item in sorted(items, key=lambda item: item["intensity_kg_per_unit"], reverse=True)[:5]
        ],
        "top_recommendations": load_fixture("dashboard.json")["top_recommendations"],
    }


def rankings(database: Session, period: str = PERIOD, sort: str = "total") -> dict[str, Any]:
    items = all_supplier_dicts(database, period)
    sort_key = "total_co2e_kg" if sort == "total" else "intensity_kg_per_unit"
    ordered = sorted(items, key=lambda item: item[sort_key], reverse=True)
    return {
        "period": period,
        "sort": sort,
        "items": [
            {key: item[key] for key in ("supplier_id", "name", "rank", "total_co2e_kg", "intensity_kg_per_unit", "carbon_risk")}
            for item in ordered
        ],
        "total": len(ordered),
    }


def hierarchy(database: Session, period: str = PERIOD) -> dict[str, Any]:
    items = all_supplier_dicts(database, period)
    by_parent: dict[str | None, list[dict[str, Any]]] = {}
    for item in items:
        by_parent.setdefault(item["parent_id"], []).append(item)

    def node(item: dict[str, Any]) -> dict[str, Any]:
        return {
            key: item[key] for key in ("supplier_id", "name", "tier", "total_co2e_kg", "carbon_risk")
        } | {"children": [node(child) for child in by_parent.get(item["supplier_id"], [])]}

    return {
        "org_id": ORG_ID,
        "org_name": "Apex Manufacturing",
        "total_co2e_kg": sum(item["total_co2e_kg"] for item in items),
        "children": [node(item) for item in by_parent.get(None, [])],
    }


def map_suppliers(database: Session, period: str = PERIOD) -> dict[str, Any]:
    items = all_supplier_dicts(database, period)
    return {
        "items": [
            {key: item[key] for key in ("supplier_id", "name", "latitude", "longitude", "total_co2e_kg", "carbon_risk", "tier")}
            for item in items
        ],
        "total": len(items),
    }
