"""Carbon simulator for Model B. Exactly simulates candidate changes."""

import uuid
from typing import Optional

from backend.engine.calculator import calculate_supplier_emissions
from backend.engine.models import SupplierActivityInput
from backend.engine.factors import FactorRegistry

from .schemas import RecommendationCandidate, Recommendation, RecommendationActionType, RecommendationStatus

def simulate_candidate(
    candidate: RecommendationCandidate,
    supplier: SupplierActivityInput,
    baseline_total: float,
    registry: Optional[FactorRegistry] = None,
    period: str = "2025"
) -> Optional[Recommendation]:
    """Applies a candidate change to the supplier and computes exact carbon impact.
    
    Returns a Recommendation object if the impact is significant (>1%), otherwise None.
    """
    if baseline_total == 0:
        return None

    # 2. Clone and apply change
    simulated_activity = supplier.model_copy(deep=True)
    
    if candidate.action_type == RecommendationActionType.RENEWABLE_ENERGY:
        if candidate.target_electricity:
            simulated_activity.electricity_source = candidate.target_electricity
            
    elif candidate.action_type == RecommendationActionType.MODAL_SHIFT:
        if candidate.target_transport:
            simulated_activity.transport_mode = candidate.target_transport.value if hasattr(candidate.target_transport, 'value') else candidate.target_transport
            
    elif candidate.action_type == RecommendationActionType.LOCAL_SOURCING:
        if candidate.distance_multiplier is not None:
            simulated_activity.transport_distance_km *= candidate.distance_multiplier
            
    elif candidate.action_type == RecommendationActionType.RECYCLED_MATERIAL:
        # Pydantic's use_enum_values=True allows us to assign string dynamically
        simulated_activity.material_code = f"recycled_{supplier.material_code}"

    # 3. Simulate new totals
    simulated_result = calculate_supplier_emissions(
        activity=simulated_activity,
        org_id=simulated_activity.org_id,
        registry=registry,
        period=period
    )
    
    projected_total = simulated_result.total_co2e_kg
    delta = baseline_total - projected_total
    
    # Drop candidates that don't reduce emissions or have negligible impact (<1%)
    # Instructions: "Drop deltas < 1% of supplier total."
    if delta < 0.01 * baseline_total:
        return None
        
    return Recommendation(
        recommendation_id=f"rec_{uuid.uuid4().hex[:8]}",
        org_id=supplier.org_id,
        supplier_id=supplier.supplier_id or "unknown",
        action_type=candidate.action_type,
        title=candidate.title,
        description=candidate.description,
        current_co2e_kg=baseline_total,
        projected_co2e_kg=projected_total,
        delta_co2e_kg=delta,
        status=RecommendationStatus.OPEN
    )
