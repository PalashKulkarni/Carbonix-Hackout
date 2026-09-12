import pytest
from backend.engine.models import SupplierActivityInput
from backend.engine.constants import MaterialCode, TransportMode, ElectricitySource, Tier
from backend.ml.model_b.service import get_model_b_service
from backend.ml.model_b.schemas import RecommendationActionType
from backend.engine.calculator import calculate_supplier_emissions

@pytest.fixture
def sample_supplier():
    return SupplierActivityInput(
        supplier_id="sup_test",
        org_id="org_test",
        name="Test Supplier",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        material_quantity_kg=10000,
        energy_kwh=20000,
        electricity_source=ElectricitySource.GRID_COAL,
        transport_distance_km=1000,
        transport_mode=TransportMode.AIR,
        location_label="Test City",
        latitude=0.0,
        longitude=0.0,
        production_volume=10,
        production_unit="tonnes"
    )

def test_model_b_end_to_end(sample_supplier):
    service = get_model_b_service()
    recs = service.get_recommendations_for_supplier(sample_supplier)
    
    assert len(recs) > 0
    
    actions = [r.action_type for r in recs]
    assert RecommendationActionType.RECYCLED_MATERIAL in actions
    assert RecommendationActionType.RENEWABLE_ENERGY in actions
    assert RecommendationActionType.MODAL_SHIFT in actions
    assert RecommendationActionType.LOCAL_SOURCING in actions
    
    # Check that deltas are positive and valid
    for r in recs:
        assert r.delta_co2e_kg > 0
        assert r.projected_co2e_kg < r.current_co2e_kg
        # Floating point tolerance
        assert abs(r.current_co2e_kg - (r.projected_co2e_kg + r.delta_co2e_kg)) < 1e-4
        assert r.rank_score is not None

def test_no_recommendations_for_perfect_supplier():
    perfect = SupplierActivityInput(
        supplier_id="sup_perfect",
        org_id="org_test",
        name="Perfect Supplier",
        tier=Tier.TIER_1,
        material_code=MaterialCode.OTHER,
        material_quantity_kg=1000,
        energy_kwh=1000,
        electricity_source=ElectricitySource.GRID_RENEWABLE,
        transport_distance_km=10,
        transport_mode=TransportMode.RAIL,
        location_label="Local",
        latitude=0.0,
        longitude=0.0,
        production_volume=1
    )
    
    service = get_model_b_service()
    recs = service.get_recommendations_for_supplier(perfect)
    assert len(recs) == 0

def test_ml_ranker_sorting(sample_supplier):
    service = get_model_b_service()
    recs = service.get_recommendations_for_supplier(sample_supplier)
    
    scores = [r.rank_score for r in recs]
    assert scores == sorted(scores, reverse=True)
    
def test_carbon_engine_integrity(sample_supplier):
    """Verify that every recommendation's carbon impact ultimately comes from the Engine."""
    service = get_model_b_service()
    baseline = calculate_supplier_emissions(sample_supplier, period="2025")
    
    recs = service.get_recommendations_for_supplier(sample_supplier)
    for rec in recs:
        # Check current matches baseline exactly
        assert abs(rec.current_co2e_kg - baseline.total_co2e_kg) < 1e-4
        # Delta should be >= 1% of baseline
        assert rec.delta_co2e_kg >= 0.01 * baseline.total_co2e_kg
        
def test_explanations_are_grounded(sample_supplier):
    """Verify that the explanation strings contain actual data metrics."""
    service = get_model_b_service()
    recs = service.get_recommendations_for_supplier(sample_supplier)
    for rec in recs:
        assert "Expected reduction:" in rec.description
        assert f"{rec.delta_co2e_kg:,.0f}" in rec.description
        pct = (rec.delta_co2e_kg / rec.current_co2e_kg) * 100
        assert f"{pct:.1f}%" in rec.description
