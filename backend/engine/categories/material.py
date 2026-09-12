"""Material bucket calculation: embodied material emissions.

Formula per docs/CARBON_ENGINE.md:
material_co2e_kg = material_quantity_kg * factor_kg_co2e_per_unit
Factor code: material_code (steel, aluminium, plastic, cement, other)
Unit: kg
"""

from typing import Optional

from ..constants import EmissionCategory, FactorCategory, MaterialCode
from ..factors import FactorLookupResult, FactorRegistry, get_default_registry
from ..models import AuditBucketDetail


def calculate_material_emissions(
    material_quantity_kg: float,
    material_code: MaterialCode,
    org_id: Optional[str] = None,
    registry: Optional[FactorRegistry] = None,
) -> tuple[float, AuditBucketDetail]:
    """Calculate material emissions in kg CO2e."""
    if registry is None:
        registry = get_default_registry()

    mat_code = material_code.value if isinstance(material_code, MaterialCode) else str(material_code)
    lookup: FactorLookupResult = registry.get_with_fallback(
        category=FactorCategory.MATERIAL,
        code=mat_code,
        org_id=org_id,
    )

    co2e_kg = round(float(material_quantity_kg) * lookup.value, 4)

    audit = AuditBucketDetail(
        category=EmissionCategory.MATERIAL,
        activity_value=float(material_quantity_kg),
        activity_unit="kg",
        factor_code=lookup.code,
        factor_value=lookup.value,
        factor_unit=lookup.unit,
        formula=f"{material_quantity_kg} kg * {lookup.value} kg CO2e/kg",
        co2e_kg=co2e_kg,
        fallback_applied=lookup.is_fallback,
        fallback_note=lookup.fallback_note,
    )

    return co2e_kg, audit

