"""Carbon risk evaluation and supplier ranking.

Follows docs/CARBON_ENGINE.md:
1. Org median of intensity_kg_per_unit (ignore zeros).
2. 'low' if intensity < 0.8 * median; 'high' if > 1.25 * median; else 'medium'.
3. Override to 'high' if total_co2e_kg / org_total >= 0.15.
4. Ranking: sort suppliers by total_co2e_kg descending, starting at rank 1.
"""

import statistics
from typing import List, Sequence

from .constants import (
    CarbonRisk,
    HIGH_RISK_MEDIAN_MULTIPLIER,
    HIGH_RISK_ORG_SHARE_THRESHOLD,
    LOW_RISK_MEDIAN_MULTIPLIER,
)
from .models import SupplierEmissionResult


def calculate_org_median_intensity(intensities: Sequence[float]) -> float:
    """Calculate median emission intensity across the organization, ignoring zeros."""
    non_zero = [i for i in intensities if i > 0]
    if not non_zero:
        return 0.0
    return float(statistics.median(non_zero))


def determine_carbon_risk(
    intensity_kg_per_unit: float,
    total_co2e_kg: float,
    org_total_co2e_kg: float,
    median_intensity: float,
) -> CarbonRisk:
    """Determine carbon risk for a supplier based on intensity and org share."""
    if median_intensity <= 0:
        # If no non-zero median, fallback to medium unless share is high
        if org_total_co2e_kg > 0 and (total_co2e_kg / org_total_co2e_kg) >= HIGH_RISK_ORG_SHARE_THRESHOLD:
            return CarbonRisk.HIGH
        return CarbonRisk.MEDIUM

    low_threshold = LOW_RISK_MEDIAN_MULTIPLIER * median_intensity
    high_threshold = HIGH_RISK_MEDIAN_MULTIPLIER * median_intensity

    if intensity_kg_per_unit < low_threshold:
        risk = CarbonRisk.LOW
    elif intensity_kg_per_unit > high_threshold:
        risk = CarbonRisk.HIGH
    else:
        risk = CarbonRisk.MEDIUM

    # Override: if supplier is >= 15% of org total emissions
    if org_total_co2e_kg > 0:
        share = total_co2e_kg / org_total_co2e_kg
        if share >= HIGH_RISK_ORG_SHARE_THRESHOLD:
            risk = CarbonRisk.HIGH

    return risk


def assign_ranks_and_risks(
    emissions: List[SupplierEmissionResult],
) -> List[SupplierEmissionResult]:
    """Compute org total, median intensity, assign ranks and carbon risks.

    Returns a new list sorted by total_co2e_kg descending with 1-based rank.
    """
    if not emissions:
        return []

    # Sort descending by total_co2e_kg
    sorted_emissions = sorted(emissions, key=lambda x: x.total_co2e_kg, reverse=True)

    org_total = sum(e.total_co2e_kg for e in sorted_emissions)
    intensities = [e.intensity_kg_per_unit for e in sorted_emissions]
    median_intensity = calculate_org_median_intensity(intensities)

    ranked_results: List[SupplierEmissionResult] = []
    for rank_idx, item in enumerate(sorted_emissions, start=1):
        risk = determine_carbon_risk(
            intensity_kg_per_unit=item.intensity_kg_per_unit,
            total_co2e_kg=item.total_co2e_kg,
            org_total_co2e_kg=org_total,
            median_intensity=median_intensity,
        )
        updated = item.model_copy(
            update={
                "rank": rank_idx,
                "carbon_risk": risk,
            }
        )
        ranked_results.append(updated)

    return ranked_results

