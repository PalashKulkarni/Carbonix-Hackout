"""Synthetic data generator for Model B ranking model.

Generates realistic supplier scenarios, applies candidates, simulates exact
carbon impact, and assigns a domain-aware "utility score" (label) for ML training.
"""

import numpy as np
import pandas as pd
from typing import List

from backend.engine.models import SupplierActivityInput
from backend.engine.constants import MaterialCode, TransportMode, ElectricitySource, Tier
from backend.engine.factors import get_default_registry
from backend.engine.calculator import calculate_supplier_emissions

from .generator import generate_candidates
from .simulator import simulate_candidate

def generate_synthetic_suppliers(n_samples: int = 1500) -> List[SupplierActivityInput]:
    """Generate realistic supplier scenarios."""
    np.random.seed(42)
    suppliers = []
    
    materials = list(MaterialCode)
    modes = list(TransportMode)
    grids = [ElectricitySource.GRID_COAL, ElectricitySource.GRID_MIXED, ElectricitySource.GRID_RENEWABLE]
    tiers = [Tier.TIER_1, Tier.TIER_2, Tier.TIER_3]
    
    for i in range(n_samples):
        mat = materials[np.random.choice(len(materials))].value
        # Quantities
        mat_qty = np.random.exponential(scale=10000)
        energy_kwh = np.random.exponential(scale=20000)
        dist_km = np.random.exponential(scale=500)
        
        mode = modes[np.random.choice(len(modes), p=[0.6, 0.2, 0.1, 0.1])].value
        grid = grids[np.random.choice(len(grids), p=[0.4, 0.5, 0.1])].value
        tier = tiers[np.random.choice(3)].value
        
        supplier = SupplierActivityInput(
            supplier_id=f"sup_synth_{i}",
            org_id="org_synthetic",
            name=f"Synthetic Supplier {i}",
            tier=tier,
            material_code=mat,
            material_quantity_kg=mat_qty,
            energy_kwh=energy_kwh,
            electricity_source=grid,
            transport_distance_km=dist_km,
            transport_mode=mode,
            location_label="Synthetic Location",
            latitude=0.0,
            longitude=0.0,
            production_volume=mat_qty / 1000.0 if mat_qty > 0 else 1.0,
            production_unit="tonnes"
        )
        suppliers.append(supplier)
        
    return suppliers

def calculate_utility_score(rec: dict, supplier: SupplierActivityInput, baseline_total: float, baseline_breakdown: dict) -> float:
    """Hidden domain function simulating expert preference."""
    delta_pct = rec['delta_co2e_kg'] / baseline_total
    score = 0.0
    
    # Base points from reduction % (0 to 10 scale roughly)
    score += delta_pct * 15.0
    
    action = rec['action_type']
    
    if action == 'renewable_energy':
        # Easy if they are Tier 1 (more direct influence), harder for Tier 3
        tier_penalty = {1: 0, 2: 1.0, 3: 2.5}.get(supplier.tier, 0)
        score += (4.0 - tier_penalty)
        
    elif action == 'modal_shift':
        # Modal shift is only really worth it if transport is > 10% of emissions
        transport_pct = baseline_breakdown.get('transport_co2e_kg', 0) / max(baseline_total, 1)
        if transport_pct < 0.1:
            score -= 3.0 # Not worth the logistical hassle
        else:
            score += 2.0
            
    elif action == 'recycled_material':
        # Highly preferred for circularity, especially for plastics and metals
        score += 5.0
        
    elif action == 'local_sourcing':
        # Extremely difficult supply chain disruption. Only recommend if transport is dominating.
        transport_pct = baseline_breakdown.get('transport_co2e_kg', 0) / max(baseline_total, 1)
        if transport_pct > 0.3:
            score += 1.0
        else:
            score -= 5.0 # Very unlikely to be accepted
            
    # Absolute reduction log-scale bonus
    score += np.log10(max(1, rec['delta_co2e_kg'])) * 0.5
        
    noise = np.random.normal(0, 0.5)
    score += noise
    
    return max(0.0, score)

def build_training_dataset(n_suppliers: int = 1500) -> pd.DataFrame:
    """Builds a dataset of candidates with calculated utility scores."""
    suppliers = generate_synthetic_suppliers(n_suppliers)
    registry = get_default_registry()
    
    data = []
    
    for supp in suppliers:
        baseline_result = calculate_supplier_emissions(activity=supp, org_id=supp.org_id, registry=registry, period='2025')
        baseline_total = baseline_result.total_co2e_kg
        if baseline_total == 0: continue
        
        breakdown = {
            'transport_co2e_kg': baseline_result.transport_co2e_kg,
            'energy_co2e_kg': baseline_result.energy_co2e_kg,
            'material_co2e_kg': baseline_result.material_co2e_kg
        }
        
        candidates = generate_candidates(supp)
        for cand in candidates:
            rec = simulate_candidate(cand, supp, baseline_total, registry)
            if rec:
                rec_dict = rec.model_dump()
                utility = calculate_utility_score(rec_dict, supp, baseline_total, breakdown)
                
                row = {
                    "supplier_id": supp.supplier_id,
                    "action_type": rec.action_type,
                    "delta_co2e_kg": rec.delta_co2e_kg,
                    "delta_pct": rec.delta_co2e_kg / baseline_total,
                    "current_co2e_kg": baseline_total,
                    "supplier_tier": supp.tier.value if hasattr(supp.tier, 'value') else supp.tier,
                    "utility_score": utility
                }
                data.append(row)
                
    return pd.DataFrame(data)

if __name__ == "__main__":
    df = build_training_dataset(2500)
    import os
    os.makedirs("backend/ml/model_b/data", exist_ok=True)
    df.to_csv("backend/ml/model_b/data/synthetic_candidates.csv", index=False)
    print(f"Generated {len(df)} synthetic candidates for training.")
