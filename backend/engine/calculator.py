"""Modular calculation pipeline coordinator for Carbon Calculation Engine.

Executes the defined calculation pipeline:
Input -> Validation -> Category Calculations (Energy, Material, Transport, Manufacturing, Logistics)
      -> Aggregation -> Intensity Calculation -> Org Ranking & Carbon Risk.
"""

from typing import Dict, List, Optional, Tuple

from .audit import build_supplier_audit
from .categories import (
    calculate_energy_emissions,
    calculate_logistics_emissions,
    calculate_manufacturing_emissions,
    calculate_material_emissions,
    calculate_transport_emissions,
)
from .constants import DataSource, EmissionCategory
from .factors import FactorRegistry, get_default_registry
from .models import (
    AuditBucketDetail,
    SupplierActivityInput,
    SupplierAuditResult,
    SupplierEmissionResult,
)
from .risk import assign_ranks_and_risks


def calculate_supplier_emissions(
    activity: SupplierActivityInput,
    org_id: Optional[str] = None,
    registry: Optional[FactorRegistry] = None,
    period: str = "2025",
) -> SupplierEmissionResult:
    """Execute emission calculations for a single supplier activity input."""
    result, _ = calculate_supplier_with_audit(
        activity=activity,
        org_id=org_id,
        registry=registry,
        period=period,
    )
    return result


def calculate_supplier_with_audit(
    activity: SupplierActivityInput,
    org_id: Optional[str] = None,
    registry: Optional[FactorRegistry] = None,
    period: str = "2025",
) -> Tuple[SupplierEmissionResult, SupplierAuditResult]:
    """Execute emission calculations and return both standard result and detailed audit trail."""
    if registry is None:
        registry = get_default_registry()

    effective_org_id = org_id or activity.org_id

    # 1. Energy bucket
    energy_co2e, energy_audit = calculate_energy_emissions(
        energy_kwh=activity.energy_kwh,
        electricity_source=activity.electricity_source,
        org_id=effective_org_id,
        registry=registry,
    )

    # 2. Material bucket
    material_co2e, material_audit = calculate_material_emissions(
        material_quantity_kg=activity.material_quantity_kg,
        material_code=activity.material_code,
        org_id=effective_org_id,
        registry=registry,
    )

    # 3. Transport bucket
    transport_co2e, transport_audit = calculate_transport_emissions(
        material_quantity_kg=activity.material_quantity_kg,
        transport_distance_km=activity.transport_distance_km,
        transport_mode=activity.transport_mode,
        org_id=effective_org_id,
        registry=registry,
    )

    # 4. Manufacturing bucket
    mfg_co2e, mfg_audit = calculate_manufacturing_emissions(
        production_volume=activity.production_volume,
        material_code=activity.material_code,
        org_id=effective_org_id,
        registry=registry,
    )

    # 5. Logistics bucket (assumed 50 km last-mile)
    logistics_co2e, logistics_audit = calculate_logistics_emissions(
        material_quantity_kg=activity.material_quantity_kg,
        org_id=effective_org_id,
        registry=registry,
    )

    # Aggregation
    total_co2e = round(
        energy_co2e + material_co2e + transport_co2e + mfg_co2e + logistics_co2e,
        4,
    )

    # Emission Intensity (kg CO2e per unit of production)
    if activity.production_volume > 0:
        intensity = round(total_co2e / activity.production_volume, 4)
    else:
        intensity = 0.0

    # Fallback tracking per docs/CARBON_ENGINE.md
    data_source = activity.data_source
    any_fallback = any(
        audit.fallback_applied
        for audit in (energy_audit, material_audit, transport_audit, mfg_audit, logistics_audit)
    )
    if any_fallback and data_source == DataSource.PRIMARY:
        data_source = DataSource.MIXED

    # Audit map
    buckets: Dict[str, AuditBucketDetail] = {
        EmissionCategory.ENERGY.value: energy_audit,
        EmissionCategory.MATERIAL.value: material_audit,
        EmissionCategory.TRANSPORT.value: transport_audit,
        EmissionCategory.MANUFACTURING.value: mfg_audit,
        EmissionCategory.LOGISTICS.value: logistics_audit,
    }

    audit_result = build_supplier_audit(
        supplier_id=activity.supplier_id,
        name=activity.name,
        buckets=buckets,
        total_co2e_kg=total_co2e,
        intensity_kg_per_unit=intensity,
        data_source=data_source,
    )

    emission_result = SupplierEmissionResult(
        supplier_id=activity.supplier_id,
        period=period,
        energy_co2e_kg=energy_co2e,
        transport_co2e_kg=transport_co2e,
        material_co2e_kg=material_co2e,
        manufacturing_co2e_kg=mfg_co2e,
        logistics_co2e_kg=logistics_co2e,
        total_co2e_kg=total_co2e,
        intensity_kg_per_unit=intensity,
        data_source=data_source,
    )

    return emission_result, audit_result


def calculate_org_emissions(
    activities: List[SupplierActivityInput],
    org_id: Optional[str] = None,
    registry: Optional[FactorRegistry] = None,
    period: str = "2025",
) -> List[SupplierEmissionResult]:
    """Calculate emissions for all suppliers in the organization, assign ranks and carbon risks."""
    if not activities:
        return []

    unranked_results: List[SupplierEmissionResult] = []
    for activity in activities:
        res = calculate_supplier_emissions(
            activity=activity,
            org_id=org_id,
            registry=registry,
            period=period,
        )
        unranked_results.append(res)

    # Assign ranks and carbon risk levels
    return assign_ranks_and_risks(unranked_results)

