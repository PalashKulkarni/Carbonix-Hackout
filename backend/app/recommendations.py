from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

try:
    from engine.carbon import calculate_emissions
    from ml.model_b.service import ModelBService
except ModuleNotFoundError:
    from backend.engine.carbon import calculate_emissions
    from backend.ml.model_b.service import ModelBService
from app.models import EmissionFactor, EmissionResult, Recommendation, Supplier
from app.engine_adapter import factor_registry, supplier_activity


def factor_map(database: Session) -> dict[tuple[str, str], float]:
    return {
        (factor.factor_category, factor.code): float(factor.factor_kg_co2e_per_unit)
        for factor in database.scalars(select(EmissionFactor)).all()
    }


def activity(supplier: Supplier) -> dict[str, Any]:
    return {
        "material_quantity_kg": supplier.material_quantity_kg,
        "energy_kwh": supplier.energy_kwh,
        "electricity_source": supplier.electricity_source,
        "transport_distance_km": supplier.transport_distance_km,
        "transport_mode": supplier.transport_mode,
        "material_code": supplier.material_code,
        "production_volume": supplier.production_volume,
    }


def candidate(supplier: Supplier, factors: dict[tuple[str, str], float], action_type: str) -> dict[str, Any] | None:
    current = calculate_emissions(activity(supplier), factors)
    changed = deepcopy(activity(supplier))
    title = ""
    description = ""

    if action_type == "recycled_material" and supplier.material_code in {"steel", "aluminium", "plastic"}:
        recycled_code = f"recycled_{supplier.material_code}"
        recycled_factor = factors.get(("material", recycled_code), factors.get(("material", supplier.material_code), 0) * 0.4)
        changed_factors = dict(factors)
        changed_factors[("material", supplier.material_code)] = recycled_factor
        projected = calculate_emissions(changed, changed_factors)
        title = f"Switch {supplier.name} to recycled {supplier.material_code}"
        description = f"Use {recycled_code} factor for material_quantity_kg."
    elif action_type == "renewable_energy" and supplier.electricity_source in {"grid_coal", "grid_mixed"}:
        changed["electricity_source"] = "grid_renewable"
        projected = calculate_emissions(changed, factors)
        title = f"Move {supplier.name} off fossil grid"
        description = "Set electricity_source to grid_renewable."
    elif action_type == "modal_shift" and supplier.transport_mode in {"air", "road"}:
        changed["transport_mode"] = "sea" if supplier.transport_mode == "air" else "rail"
        projected = calculate_emissions(changed, factors)
        title = f"Shift {supplier.name} inbound freight"
        description = f"Set transport_mode to {changed['transport_mode']}; keep distance."
    else:
        return None

    delta = current["total_co2e_kg"] - projected["total_co2e_kg"]
    if delta <= current["total_co2e_kg"] * 0.01:
        return None
    return {
        "recommendation_id": f"rec_{uuid4().hex[:12]}",
        "org_id": supplier.org_id,
        "supplier_id": supplier.supplier_id,
        "action_type": action_type,
        "title": title,
        "description": description,
        "current_co2e_kg": current["total_co2e_kg"],
        "projected_co2e_kg": projected["total_co2e_kg"],
        "delta_co2e_kg": delta,
        "status": "open",
        "created_at": datetime.now(timezone.utc),
    }


def refresh_recommendations(database: Session, period: str = "2025") -> None:
    database.execute(delete(Recommendation))
    suppliers = database.scalars(select(Supplier)).all()
    model_b = ModelBService(registry=factor_registry(database))
    for supplier in suppliers:
        activity_input = supplier_activity(supplier)
        recommendations = model_b.get_recommendations_for_supplier(activity_input, period)
        for recommendation in recommendations:
            database.add(Recommendation(
                recommendation_id=recommendation.recommendation_id,
                org_id=recommendation.org_id,
                supplier_id=recommendation.supplier_id,
                action_type=getattr(recommendation.action_type, "value", recommendation.action_type),
                title=recommendation.title,
                description=recommendation.description,
                current_co2e_kg=recommendation.current_co2e_kg,
                projected_co2e_kg=recommendation.projected_co2e_kg,
                delta_co2e_kg=recommendation.delta_co2e_kg,
                status=getattr(recommendation.status, "value", recommendation.status),
            ))


def recommendation_dict(recommendation: Recommendation) -> dict[str, Any]:
    return {
        "recommendation_id": recommendation.recommendation_id,
        "org_id": recommendation.org_id,
        "supplier_id": recommendation.supplier_id,
        "action_type": recommendation.action_type,
        "title": recommendation.title,
        "description": recommendation.description,
        "current_co2e_kg": float(recommendation.current_co2e_kg),
        "projected_co2e_kg": float(recommendation.projected_co2e_kg),
        "delta_co2e_kg": float(recommendation.delta_co2e_kg),
        "status": recommendation.status,
    }
