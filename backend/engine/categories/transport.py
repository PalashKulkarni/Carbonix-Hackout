"""Transport bucket calculation: inbound freight emissions.

Formula per docs/CARBON_ENGINE.md:
Let t = material_quantity_kg / 1000 (tonnes of goods, for freight)
transport_co2e_kg = (t * transport_distance_km) * factor_kg_co2e_per_unit
Factor code: transport_mode (road, rail, sea, air)
Unit: tonne_km
"""

from typing import Optional

from ..constants import EmissionCategory, FactorCategory, TransportMode
from ..factors import FactorLookupResult, FactorRegistry, get_default_registry
from ..models import AuditBucketDetail
from ..units import calculate_tonne_km, kg_to_tonnes


def calculate_transport_emissions(
    material_quantity_kg: float,
    transport_distance_km: float,
    transport_mode: TransportMode,
    org_id: Optional[str] = None,
    registry: Optional[FactorRegistry] = None,
) -> tuple[float, AuditBucketDetail]:
    """Calculate freight transport emissions in kg CO2e."""
    if registry is None:
        registry = get_default_registry()

    mode_code = transport_mode.value if isinstance(transport_mode, TransportMode) else str(transport_mode)
    lookup: FactorLookupResult = registry.get_with_fallback(
        category=FactorCategory.TRANSPORT,
        code=mode_code,
        org_id=org_id,
    )

    tonnes = kg_to_tonnes(float(material_quantity_kg))
    tonne_km = calculate_tonne_km(float(material_quantity_kg), float(transport_distance_km))
    co2e_kg = round(tonne_km * lookup.value, 4)

    formula_str = (
        f"({tonnes} tonnes * {transport_distance_km} km = {tonne_km} tonne_km) * "
        f"{lookup.value} kg CO2e/tonne_km"
    )

    audit = AuditBucketDetail(
        category=EmissionCategory.TRANSPORT,
        activity_value=round(tonne_km, 4),
        activity_unit="tonne_km",
        factor_code=lookup.code,
        factor_value=lookup.value,
        factor_unit=lookup.unit,
        formula=formula_str,
        co2e_kg=co2e_kg,
        fallback_applied=lookup.is_fallback,
        fallback_note=lookup.fallback_note,
    )

    return co2e_kg, audit

