"""Pydantic schemas for Model A: Activity Gap-Fill.

Conforms to docs/ML.md, docs/GLOSSARY.md, and docs/DATA_MODEL.md.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from backend.engine.constants import (
    DataSource,
    ElectricitySource,
    MaterialCode,
    Tier,
    TransportMode,
)


class FieldProvenance(BaseModel):
    """Provenance and trace of an individual activity field estimate."""

    model_config = ConfigDict(extra="ignore")

    field_name: str
    original_value: Optional[float] = None
    estimated_value: Optional[float] = None
    was_modeled: bool = False
    method: str = "provided"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    peer_sample_size: int = 0


class GapFillRequest(BaseModel):
    """Input supplier activity with possible null/missing activity fields.

    Per docs/ML.md:
    "When CSV/manual row has zeros/nulls for energy_kwh, transport_distance_km,
    material_quantity_kg, or production_volume, but other fields exist."
    """

    model_config = ConfigDict(extra="ignore", use_enum_values=True, allow_inf_nan=False)

    supplier_id: Optional[str] = None
    org_id: str = "org_apex"
    parent_id: Optional[str] = None
    name: str = "Unknown Supplier"
    tier: Tier = Tier.TIER_1
    material_code: MaterialCode = MaterialCode.STEEL
    location_label: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    electricity_source: ElectricitySource = ElectricitySource.GRID_MIXED
    transport_mode: TransportMode = TransportMode.ROAD
    production_unit: str = "tonnes"
    data_source: DataSource = DataSource.PRIMARY

    # Target estimatable fields (None or 0 when missing).  Keep validation in
    # step with SupplierActivityInput: a negative activity is never a valid
    # observation and must not silently become a model input.
    material_quantity_kg: Optional[float] = Field(default=None, ge=0.0)
    energy_kwh: Optional[float] = Field(default=None, ge=0.0)
    transport_distance_km: Optional[float] = Field(default=None, ge=0.0)
    production_volume: Optional[float] = Field(default=None, ge=0.0)


class GapFillResponse(BaseModel):
    """Output of Model A gap-fill estimation matching docs/ML.md.

    Only filled fields are populated (others are None).
    """

    model_config = ConfigDict(extra="ignore", use_enum_values=True)

    supplier_id: Optional[str] = None
    filled_fields: List[str] = Field(default_factory=list)
    energy_kwh: Optional[float] = None
    material_quantity_kg: Optional[float] = None
    transport_distance_km: Optional[float] = None
    production_volume: Optional[float] = None
    data_source: DataSource = DataSource.MODELED
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    provenance: Optional[Dict[str, FieldProvenance]] = None
