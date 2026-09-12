"""Model B Service: orchestrates recommendation generation, simulation, and ML ranking."""

from typing import List, Optional

from backend.engine.calculator import calculate_supplier_emissions
from backend.engine.models import SupplierActivityInput
from backend.engine.factors import FactorRegistry, get_default_registry

from .generator import generate_candidates
from .simulator import simulate_candidate
from .ranker import get_ml_ranker
from .schemas import Recommendation

class ModelBService:
    """Service coordinating candidate generation, engine simulation, and ranking."""
    
    def __init__(self, registry: Optional[FactorRegistry] = None):
        self.registry = registry or get_default_registry()
        self.ranker = get_ml_ranker()
        
    def get_recommendations_for_supplier(
        self,
        supplier: SupplierActivityInput,
        period: str = "2025"
    ) -> List[Recommendation]:
        """Generate, simulate, and rank recommendations for a single supplier."""
        # 1. Baseline emissions calculation (done once)
        baseline_result = calculate_supplier_emissions(
            activity=supplier, 
            org_id=supplier.org_id, 
            registry=self.registry, 
            period=period
        )
        baseline_total = baseline_result.total_co2e_kg
        
        if baseline_total == 0:
            return []
            
        # 2. Generate valid candidates
        candidates = generate_candidates(supplier)
        
        # 3. Simulate exact carbon impact
        valid_recs = []
        for cand in candidates:
            rec = simulate_candidate(
                candidate=cand,
                supplier=supplier,
                baseline_total=baseline_total,
                registry=self.registry,
                period=period
            )
            if rec is not None:
                valid_recs.append(rec)
                
        # 4. ML Ranking
        ranked_recs = self.ranker.rank(valid_recs, supplier)
        
        # 5. Ground Explanations
        for rec in ranked_recs:
            pct_reduction = (rec.delta_co2e_kg / rec.current_co2e_kg) * 100 if rec.current_co2e_kg > 0 else 0
            base_desc = rec.description
            
            # Add grounded explanation
            explanation_parts = [base_desc]
            explanation_parts.append(f"Expected reduction: {pct_reduction:.1f}% ({rec.delta_co2e_kg:,.0f} kg CO2e).")
            
            if hasattr(rec, 'confidence') and rec.confidence is not None:
                if rec.confidence >= 0.8:
                    explanation_parts.append("High confidence based on operational profile similarity.")
                elif rec.confidence < 0.6:
                    explanation_parts.append("Lower confidence; verify operational feasibility.")
                    
            rec.description = " ".join(explanation_parts)
            
        return ranked_recs

# Global service instance
_default_model_b_service: Optional[ModelBService] = None

def get_model_b_service() -> ModelBService:
    """Get or initialize the global Model B service."""
    global _default_model_b_service
    if _default_model_b_service is None:
        _default_model_b_service = ModelBService()
    return _default_model_b_service
