"""Manufacturing bucket calculation: process / production energy beyond billed kWh split.

Formula per docs/CARBON_ENGINE.md:
manufacturing_co2e_kg = production_volume * factor_kg_co2e_per_unit
Factor code: mfg_{material_code}
Unit: unit_output
"""

from typing import Optional

from ..constants import EmissionCategory, FactorCategory, MaterialCode
from ..factors import FactorLookupResult, FactorRegistry, get_default_registry
from ..models import AuditBucketDetail


def calculate_manufacturing_emissions(
    production_volume: float,
    material_code: MaterialCode,
    org_id: Optional[str] = None,
    registry: Optional[FactorRegistry] = None,
) -> tuple[float, AuditBucketDetail]:
    """Calculate process manufacturing emissions in kg CO2e."""
    if registry is None:
        registry = get_default_registry()

    mat_code = material_code.value if isinstance(material_code, MaterialCode) else str(material_code)
    mfg_code = f"mfg_{mat_code}"

    lookup: FactorLookupResult = registry.get_with_fallback(
        category=FactorCategory.MANUFACTURING,
        code=mfg_code,
        org_id=org_id,
    )

    co2e_kg = round(float(production_volume) * lookup.value, 4)

    audit = AuditBucketDetail(
        category=EmissionCategory.MANUFACTURING,
        activity_value=float(production_volume),
        activity_unit="unit_output",
        factor_code=lookup.code,
        factor_value=lookup.value,
        factor_unit=lookup.unit,
        formula=f"{production_volume} units * {lookup.value} kg CO2e/unit",
        co2e_kg=co2e_kg,
        fallback_applied=lookup.is_fallback,
        fallback_note=lookup.fallback_note,
    )

    return co2e_kg, audit

