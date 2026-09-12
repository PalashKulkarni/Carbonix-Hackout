"""Candidate generator for Model B. Proposes valid interventions for a supplier."""

from typing import List
from backend.engine.models import SupplierActivityInput
from backend.engine.constants import MaterialCode, TransportMode, ElectricitySource
from .schemas import RecommendationCandidate, RecommendationActionType

def generate_candidates(supplier: SupplierActivityInput) -> List[RecommendationCandidate]:
    """Generate physically and logically valid candidate interventions for a supplier."""
    candidates = []

    # 1. Recycled Material
    # Only applicable if using virgin material and we have recycled factors for it
    # Supported in fixtures: steel, aluminium, plastic
    if supplier.material_quantity_kg > 0:
        if supplier.material_code in [MaterialCode.STEEL, MaterialCode.ALUMINIUM, MaterialCode.PLASTIC]:
            candidates.append(
                RecommendationCandidate(
                    action_type=RecommendationActionType.RECYCLED_MATERIAL,
                    title=f"Switch {supplier.name} to recycled {supplier.material_code}",
                    description=f"Replace virgin {supplier.material_code} factor with recycled_{supplier.material_code} and re-run the engine.",
                    target_material=supplier.material_code
                )
            )

    # 2. Renewable Energy
    # Applicable if using grid_coal or grid_mixed
    if supplier.energy_kwh > 0:
        if supplier.electricity_source in [ElectricitySource.GRID_COAL, ElectricitySource.GRID_MIXED]:
            candidates.append(
                RecommendationCandidate(
                    action_type=RecommendationActionType.RENEWABLE_ENERGY,
                    title=f"Move {supplier.name} off coal/mixed grid to renewable",
                    description="Set electricity_source to grid_renewable.",
                    target_electricity=ElectricitySource.GRID_RENEWABLE
                )
            )

    # 3. Modal Shift
    # Applicable if using air or road and distance > 0
    if supplier.transport_distance_km > 0:
        if supplier.transport_mode == TransportMode.AIR:
            candidates.append(
                RecommendationCandidate(
                    action_type=RecommendationActionType.MODAL_SHIFT,
                    title=f"Shift {supplier.name} inbound freight from air to sea",
                    description="Set transport_mode to sea; keep distance.",
                    target_transport=TransportMode.SEA
                )
            )
            # Also consider rail if appropriate, though sea is common alternative for air.
        elif supplier.transport_mode == TransportMode.ROAD:
            if supplier.transport_distance_km > 100:  # Sensible threshold for rail
                candidates.append(
                    RecommendationCandidate(
                        action_type=RecommendationActionType.MODAL_SHIFT,
                        title=f"Shift {supplier.name} inbound freight from road to rail",
                        description="Set transport_mode to rail; keep distance.",
                        target_transport=TransportMode.RAIL
                    )
                )

    # 4. Local Sourcing
    # Meaningful if distance is large
    if supplier.transport_distance_km > 200:
        candidates.append(
            RecommendationCandidate(
                action_type=RecommendationActionType.LOCAL_SOURCING,
                title=f"Source locally for {supplier.name} to reduce transport",
                description="Reduce transport_distance_km by sourcing closer.",
                distance_multiplier=0.3
            )
        )

    return candidates
