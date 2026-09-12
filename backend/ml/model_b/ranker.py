"""ML Ranker for Model B. Uses trained LightGBM/HistGradientBoosting model to score candidates."""

import os
import joblib
import pandas as pd
from typing import List, Optional
from pathlib import Path

from backend.engine.models import SupplierActivityInput
from .schemas import Recommendation

class MLRanker:
    """Predicts a utility score for each recommendation and sorts them."""
    
    def __init__(self):
        self.model = None
        self._load_model()
        
    def _load_model(self):
        """Loads the pre-trained model artifact if available."""
        artifact_path = Path(__file__).parent / "artifacts" / "ranker_model.joblib"
        if artifact_path.exists():
            try:
                self.model = joblib.load(artifact_path)
            except Exception as e:
                print(f"Warning: Failed to load Model B ranker artifact: {e}")
                self.model = None

    def rank(
        self,
        recommendations: List[Recommendation],
        supplier: SupplierActivityInput
    ) -> List[Recommendation]:
        """Scores and sorts the recommendations."""
        if not recommendations:
            return []
            
        if self.model is None:
            # Fallback to rule-based sorting: delta_co2e_kg descending
            recommendations.sort(key=lambda r: r.delta_co2e_kg, reverse=True)
            for i, r in enumerate(recommendations):
                r.rank_score = float(r.delta_co2e_kg)
                r.confidence = 0.8 # Fixed confidence for fallback
            return recommendations
            
        # Prepare features for ML inference
        rows = []
        for r in recommendations:
            rows.append({
                "action_type": r.action_type.value if hasattr(r.action_type, 'value') else r.action_type,
                "delta_co2e_kg": r.delta_co2e_kg,
                "delta_pct": r.delta_co2e_kg / r.current_co2e_kg if r.current_co2e_kg > 0 else 0,
                "supplier_tier": supplier.tier.value if hasattr(supplier.tier, 'value') else supplier.tier,
                "current_co2e_kg": r.current_co2e_kg
            })
            
        df = pd.DataFrame(rows)
        
        try:
            scores = self.model.predict(df)
            
            # Assign scores and sort
            for r, score in zip(recommendations, scores):
                r.rank_score = float(score)
                # Confidence could be derived from prediction intervals, here we proxy it
                r.confidence = min(1.0, max(0.5, 0.5 + (r.delta_co2e_kg / max(r.current_co2e_kg, 1)) * 0.5))
                
            recommendations.sort(key=lambda r: r.rank_score, reverse=True)
        except Exception as e:
            print(f"Prediction failed: {e}. Falling back to deterministic sort.")
            recommendations.sort(key=lambda r: r.delta_co2e_kg, reverse=True)
            
        return recommendations

# Global instance
_default_ranker: Optional[MLRanker] = None

def get_ml_ranker() -> MLRanker:
    global _default_ranker
    if _default_ranker is None:
        _default_ranker = MLRanker()
    return _default_ranker
