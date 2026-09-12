
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.engine.constants import MaterialCode, TransportMode

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

class RecommendationCandidate(BaseModel):
    """Internal model for a generated recommendation before simulation."""
    action_type: RecommendationActionType
    title: str
    description: str
    target_material: Optional[MaterialCode] = None
    target_transport: Optional[TransportMode] = None
    target_electricity: Optional[str] = None
    distance_multiplier: Optional[float] = None
    alternative_supplier_id: Optional[str] = None
    
class Recommendation(BaseModel):
    """Final output recommendation object matching fixtures/recommendations.json."""
    model_config = ConfigDict(extra="ignore", use_enum_values=True)
    
    recommendation_id: str
    org_id: str
    supplier_id: str
    action_type: RecommendationActionType
    title: str
    description: str
    current_co2e_kg: float = Field(..., ge=0.0)
    projected_co2e_kg: float = Field(..., ge=0.0)
    delta_co2e_kg: float = Field(..., ge=0.0)
    status: RecommendationStatus = RecommendationStatus.OPEN
    # Additional fields to track for ML ranking explanation
    confidence: Optional[float] = None
    rank_score: Optional[float] = None
