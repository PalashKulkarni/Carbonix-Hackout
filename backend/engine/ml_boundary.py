"""Integration boundary between Carbon Engine and ML modules (Model A & Model B).

Per docs/ML.md and docs/CARBON_ENGINE.md:
- Model A: fills missing activity fields, sets data_source=modeled/mixed,
  then backend re-runs the engine. Official totals are never ML output.
- Model B: proposes recommendation alternatives; delta_co2e_kg comes from
  re-running the carbon engine.
"""

from typing import Any, Dict, Optional, Tuple

from .constants import DataSource, ElectricitySource, RecommendationActionType, TransportMode
from .models import SupplierActivityInput


def apply_gap_fill(
    activity: SupplierActivityInput,
    gap_fill_result: Dict[str, Any],
) -> SupplierActivityInput:
    """Apply Model A gap-filled activity data to supplier activity input.

    Sets data_source to 'modeled' (or 'mixed' if existing fields were primary).
    """
    filled_fields = gap_fill_result.get("filled_fields", [])
    updates: Dict[str, Any] = {}

    for field in filled_fields:
        if field in gap_fill_result and gap_fill_result[field] is not None:
            updates[field] = gap_fill_result[field]

    # Set data source: modeled if every estimatable activity was absent, else
    # mixed. Never trust a caller-provided label over the record being updated.
    current_source = activity.data_source
    activity_fields = (
        "energy_kwh",
        "material_quantity_kg",
        "transport_distance_km",
        "production_volume",
    )
    all_activity_was_missing = all(getattr(activity, field, 0) == 0 for field in activity_fields)
    if filled_fields and all_activity_was_missing:
        updates["data_source"] = DataSource.MODELED
    elif current_source == DataSource.PRIMARY and filled_fields:
        updates["data_source"] = DataSource.MIXED
    elif not current_source:
        updates["data_source"] = DataSource.MODELED

    return activity.model_copy(update=updates)


def apply_recommendation_alternative(
    activity: SupplierActivityInput,
    action_type: RecommendationActionType,
    params: Optional[Dict[str, Any]] = None,
) -> Tuple[SupplierActivityInput, Optional[str]]:
    """Clone activity and apply a proposed Model B alternative for engine recalculation.

    Returns modified SupplierActivityInput and a description of the change.
    """
    params = params or {}
    modified = activity.model_copy()
    desc: Optional[str] = None

    if action_type == RecommendationActionType.RENEWABLE_ENERGY:
        # Switch electricity source to grid_renewable or onsite_solar
        target_source = params.get("electricity_source", ElectricitySource.GRID_RENEWABLE)
        modified.electricity_source = target_source
        desc = f"Set electricity_source to {target_source.value if hasattr(target_source, 'value') else target_source}."

    elif action_type == RecommendationActionType.MODAL_SHIFT:
        # Shift freight transport mode, e.g., road/air -> rail or sea
        target_mode = params.get("transport_mode", TransportMode.RAIL)
        modified.transport_mode = target_mode
        desc = f"Set transport_mode to {target_mode.value if hasattr(target_mode, 'value') else target_mode}."

    elif action_type == RecommendationActionType.LOCAL_SOURCING:
        # Cut transport distance (default 30% of original distance per docs/ML.md)
        reduction_factor = params.get("distance_multiplier", 0.3)
        modified.transport_distance_km = round(activity.transport_distance_km * reduction_factor, 2)
        desc = f"Reduce transport distance by {int((1 - reduction_factor) * 100)}% via local sourcing."

    elif action_type in (RecommendationActionType.RECYCLED_MATERIAL, RecommendationActionType.LOW_CARBON_MATERIAL):
        # Material switch is handled via factor selection or material code change
        target_material = params.get("material_code")
        if target_material:
            modified.material_code = target_material
            desc = f"Switch material_code to {target_material}."
        else:
            desc = f"Use alternative lower carbon factor for {activity.material_code}."

    return modified, desc
