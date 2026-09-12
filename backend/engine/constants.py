"""Constants and Enums for Carbon Calculation Engine.

Frozen to match docs/GLOSSARY.md, docs/DATA_MODEL.md, and docs/CARBON_ENGINE.md.
"""

from enum import Enum


class Tier(int, Enum):
    TIER_1 = 1
    TIER_2 = 2
    TIER_3 = 3


class MaterialCode(str, Enum):
    STEEL = "steel"
    ALUMINIUM = "aluminium"
    PLASTIC = "plastic"
    CEMENT = "cement"
    OTHER = "other"


class ElectricitySource(str, Enum):
    GRID_COAL = "grid_coal"
    GRID_MIXED = "grid_mixed"
    GRID_RENEWABLE = "grid_renewable"
    ONSITE_SOLAR = "onsite_solar"


class TransportMode(str, Enum):
    ROAD = "road"
    RAIL = "rail"
    SEA = "sea"
    AIR = "air"


class EmissionCategory(str, Enum):
    ENERGY = "energy"
    TRANSPORT = "transport"
    MATERIAL = "material"
    MANUFACTURING = "manufacturing"
    LOGISTICS = "logistics"


class FactorCategory(str, Enum):
    MATERIAL = "material"
    ENERGY = "energy"
    TRANSPORT = "transport"
    MANUFACTURING = "manufacturing"
    LOGISTICS = "logistics"


class CarbonRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DataSource(str, Enum):
    PRIMARY = "primary"
    MODELED = "modeled"
    MIXED = "mixed"


class RecommendationActionType(str, Enum):
    RECYCLED_MATERIAL = "recycled_material"
    LOW_CARBON_MATERIAL = "low_carbon_material"
    RENEWABLE_ENERGY = "renewable_energy"
    MODAL_SHIFT = "modal_shift"
    LOCAL_SOURCING = "local_sourcing"
    ALTERNATIVE_SUPPLIER = "alternative_supplier"


class RecommendationStatus(str, Enum):
    OPEN = "open"
    ACCEPTED = "accepted"
    DISMISSED = "dismissed"
    IN_PROGRESS = "in_progress"


# Fallback codes per docs/CARBON_ENGINE.md
FALLBACK_MATERIAL_CODE = "other"
FALLBACK_ELECTRICITY_SOURCE = "grid_mixed"
FALLBACK_TRANSPORT_MODE = "road"
LOGISTICS_ROAD_FACTOR_CODE = "logistics_road"
DEFAULT_LAST_MILE_KM = 50.0

# Threshold constants per docs/CARBON_ENGINE.md
LOW_RISK_MEDIAN_MULTIPLIER = 0.8
HIGH_RISK_MEDIAN_MULTIPLIER = 1.25
HIGH_RISK_ORG_SHARE_THRESHOLD = 0.15

