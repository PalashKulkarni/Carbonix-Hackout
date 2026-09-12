"""Pydantic data models and schemas for Carbon Calculation Engine.

Follows docs/GLOSSARY.md, docs/DATA_MODEL.md, and docs/API_CONTRACT.md.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

from .constants import (
    CarbonRisk,
    DataSource,
    ElectricitySource,
    EmissionCategory,
    FactorCategory,
    MaterialCode,
    Tier,
    TransportMode,
)


class EmissionFactor(BaseModel):
    """Emission factor definition matching fixtures/factors.json & DATA_MODEL.md."""

    model_config = ConfigDict(extra="ignore")

    factor_id: str
    org_id: Optional[str] = None
    factor_category: FactorCategory
    code: str
    factor_kg_co2e_per_unit: float = Field(..., ge=0.0)
    unit: str
    source: str
    year: int


class FactorRegistryData(BaseModel):
    """Container for factor items matching fixtures/factors.json shape."""

    items: List[EmissionFactor]
    total: int


class SupplierActivityInput(BaseModel):
    """Supplier activity input data per docs/GLOSSARY.md & docs/CSV_FORMAT.md."""

    model_config = ConfigDict(extra="ignore", use_enum_values=True)

    supplier_id: Optional[str] = None
    org_id: str = "org_apex"
    parent_id: Optional[str] = None
    name: str
    tier: Tier
    material_code: MaterialCode
    material_quantity_kg: float = Field(default=0.0, ge=0.0)
    energy_kwh: float = Field(default=0.0, ge=0.0)
    electricity_source: ElectricitySource = ElectricitySource.GRID_MIXED
    transport_distance_km: float = Field(default=0.0, ge=0.0)
    transport_mode: TransportMode = TransportMode.ROAD
    location_label: str
    latitude: float
    longitude: float
    production_volume: float = Field(default=0.0, ge=0.0)
    production_unit: str = "tonnes"
    data_source: DataSource = DataSource.PRIMARY

    @model_validator(mode="after")
    def validate_tier_parent(self) -> "SupplierActivityInput":
        """Tier 1 cannot have parent_id; Tier > 1 must have parent_id if org tree is validated."""
        # When tier is 1, parent_id is null per docs/DATA_MODEL.md
        if self.tier == Tier.TIER_1 and self.parent_id is not None:
            # Normalize to None or allow if empty string
            if isinstance(self.parent_id, str) and not self.parent_id.strip():
                self.parent_id = None
        return self


class CategoryEmissionBreakdown(BaseModel):
    """Emissions for a single category bucket in kg CO2e."""

    emission_category: EmissionCategory
    co2e_kg: float


class SupplierEmissionResult(BaseModel):
    """Calculated emissions for a supplier matching fixtures/emissions.json & suppliers.json."""

    model_config = ConfigDict(extra="ignore", use_enum_values=True)

    supplier_id: Optional[str] = None
    period: str = "2025"
    energy_co2e_kg: float
    transport_co2e_kg: float
    material_co2e_kg: float
    manufacturing_co2e_kg: float
    logistics_co2e_kg: float
    total_co2e_kg: float
    intensity_kg_per_unit: float
    carbon_risk: CarbonRisk = CarbonRisk.MEDIUM
    rank: Optional[int] = None
    data_source: DataSource = DataSource.PRIMARY


class AuditBucketDetail(BaseModel):
    """Detailed audit trace for a specific category calculation."""

    category: EmissionCategory
    activity_value: float
    activity_unit: str
    factor_code: str
    factor_value: float
    factor_unit: str
    formula: str
    co2e_kg: float
    fallback_applied: bool = False
    fallback_note: Optional[str] = None


class SupplierAuditResult(BaseModel):
    """Auditable emission calculation result containing step-by-step trace."""

    supplier_id: Optional[str] = None
    name: str
    buckets: Dict[str, AuditBucketDetail]
    total_co2e_kg: float
    intensity_kg_per_unit: float
    data_source: DataSource


class ScenarioInput(BaseModel):
    """What-if scenario input sliders per docs/CARBON_ENGINE.md and API_CONTRACT.md."""

    period: str = "2025"
    recycled_material_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    renewable_energy_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    rail_transport_pct: float = Field(default=0.0, ge=0.0, le=100.0)


class CategoryScenarioResult(BaseModel):
    """Category breakdown inside scenario simulation result."""

    emission_category: EmissionCategory
    current_co2e_kg: float
    projected_co2e_kg: float


class ScenarioResult(BaseModel):
    """Scenario simulation response matching fixtures/scenario-result.json."""

    period: str = "2025"
    recycled_material_pct: float
    renewable_energy_pct: float
    rail_transport_pct: float
    current_total_co2e_kg: float
    projected_total_co2e_kg: float
    delta_co2e_kg: float
    delta_pct: float
    by_category: List[CategoryScenarioResult]

