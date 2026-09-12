"""Model A: Activity Gap-Fill module.

Per docs/ML.md and docs/CARBON_ENGINE.md:
- Estimates missing activity fields (energy_kwh, transport_distance_km, material_quantity_kg, production_volume).
- Sets data_source to 'modeled' or 'mixed'.
- Never independently calculates official total_co2e_kg.
"""

from .base import BaseActivityEstimator
from .peer_group import PeerGroupEstimator
from .schemas import FieldProvenance, GapFillRequest, GapFillResponse
from .service import ModelAService, get_model_a_service

__all__ = [
    "BaseActivityEstimator",
    "PeerGroupEstimator",
    "GapFillRequest",
    "GapFillResponse",
    "FieldProvenance",
    "ModelAService",
    "get_model_a_service",
]

