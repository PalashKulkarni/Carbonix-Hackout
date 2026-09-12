"""Energy bucket calculation: electricity and fuel emissions.

Formula per docs/CARBON_ENGINE.md:
energy_co2e_kg = energy_kwh * factor_kg_co2e_per_unit
Factor code: electricity_source (grid_coal, grid_mixed, grid_renewable, onsite_solar)
Unit: kWh
"""

from typing import Optional

from ..constants import ElectricitySource, EmissionCategory, FactorCategory
from ..factors import FactorLookupResult, FactorRegistry, get_default_registry
from ..models import AuditBucketDetail


def calculate_energy_emissions(
    energy_kwh: float,
    electricity_source: ElectricitySource,
    org_id: Optional[str] = None,
    registry: Optional[FactorRegistry] = None,
) -> tuple[float, AuditBucketDetail]:
    """Calculate energy emissions in kg CO2e."""
    if registry is None:
        registry = get_default_registry()

    source_code = electricity_source.value if isinstance(electricity_source, ElectricitySource) else str(electricity_source)
    lookup: FactorLookupResult = registry.get_with_fallback(
        category=FactorCategory.ENERGY,
        code=source_code,
        org_id=org_id,
    )

    co2e_kg = round(float(energy_kwh) * lookup.value, 4)

    audit = AuditBucketDetail(
        category=EmissionCategory.ENERGY,
        activity_value=float(energy_kwh),
        activity_unit="kWh",
        factor_code=lookup.code,
        factor_value=lookup.value,
        factor_unit=lookup.unit,
        formula=f"{energy_kwh} kWh * {lookup.value} kg CO2e/kWh",
        co2e_kg=co2e_kg,
        fallback_applied=lookup.is_fallback,
        fallback_note=lookup.fallback_note,
    )

    return co2e_kg, audit
