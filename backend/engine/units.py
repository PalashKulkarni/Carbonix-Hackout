"""Unit normalization and conversion utilities for Carbon Calculation Engine.

Per docs/GLOSSARY.md:
- Mass: kg (stored and calculated in kg)
- Energy: kWh
- Distance: km
- Freight activity: tonne_km (tonnes * km)
- Production volume: number + production_unit (demo default: tonnes)
"""


def kg_to_tonnes(kg: float) -> float:
    """Convert kilograms to metric tonnes."""
    return kg / 1000.0


def tonnes_to_kg(tonnes: float) -> float:
    """Convert metric tonnes to kilograms."""
    return tonnes * 1000.0


def mwh_to_kwh(mwh: float) -> float:
    """Convert megawatt-hours to kilowatt-hours."""
    return mwh * 1000.0


def calculate_tonne_km(mass_kg: float, distance_km: float) -> float:
    """Calculate tonne-kilometres for freight activity.

    Per docs/CARBON_ENGINE.md:
    Let t = material_quantity_kg / 1000 (tonnes of goods, for freight).
    tonne_km = t * distance_km
    """
    tonnes = kg_to_tonnes(mass_kg)
    return tonnes * distance_km

