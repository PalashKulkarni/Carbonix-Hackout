"""Carbon Emission Calculation Engine for Supply Chain Dashboard.

Pure Python implementation per docs/CARBON_ENGINE.md.
"""

from .audit import build_supplier_audit
from .calculator import (
    calculate_org_emissions,
    calculate_supplier_emissions,
    calculate_supplier_with_audit,
)
from .constants import (
    CarbonRisk,
    DataSource,
    ElectricitySource,
    EmissionCategory,
    FactorCategory,
    MaterialCode,
    RecommendationActionType,
    RecommendationStatus,
    Tier,
    TransportMode,
)
from .factors import FactorLookupResult, FactorRegistry, get_default_registry
from .ml_boundary import apply_gap_fill, apply_recommendation_alternative
from .models import (
    AuditBucketDetail,
    EmissionFactor,
    ScenarioInput,
    ScenarioResult,
    SupplierActivityInput,
    SupplierAuditResult,
    SupplierEmissionResult,
)
from .risk import assign_ranks_and_risks, calculate_org_median_intensity, determine_carbon_risk
from .scenario import simulate_scenario
from .units import calculate_tonne_km, kg_to_tonnes, mwh_to_kwh, tonnes_to_kg

__all__ = [
    # Main calculation endpoints
    "calculate_supplier_emissions",
    "calculate_supplier_with_audit",
    "calculate_org_emissions",
    "simulate_scenario",
    # Risk and ranking
    "determine_carbon_risk",
    "calculate_org_median_intensity",
    "assign_ranks_and_risks",
    # Factors & Registry
    "FactorRegistry",
    "get_default_registry",
    "FactorLookupResult",
    # ML integration hooks
    "apply_gap_fill",
    "apply_recommendation_alternative",
    # Units
    "kg_to_tonnes",
    "tonnes_to_kg",
    "calculate_tonne_km",
    "mwh_to_kwh",
    # Models
    "SupplierActivityInput",
    "SupplierEmissionResult",
    "EmissionFactor",
    "ScenarioInput",
    "ScenarioResult",
    "AuditBucketDetail",
    "SupplierAuditResult",
    # Constants
    "Tier",
    "MaterialCode",
    "ElectricitySource",
    "TransportMode",
    "EmissionCategory",
    "FactorCategory",
    "CarbonRisk",
    "DataSource",
    "RecommendationActionType",
    "RecommendationStatus",
    "build_supplier_audit",
]

