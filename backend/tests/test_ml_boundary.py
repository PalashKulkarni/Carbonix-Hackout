"""Unit tests for ML integration boundary (Model A gap-fill and Model B rec alternatives)."""

import pytest

from backend.engine import (
    DataSource,
    ElectricitySource,
    MaterialCode,
    RecommendationActionType,
    SupplierActivityInput,
    Tier,
    TransportMode,
    apply_gap_fill,
    apply_recommendation_alternative,
    calculate_supplier_emissions,
    kg_to_tonnes,
    mwh_to_kwh,
    tonnes_to_kg,
)


def test_unit_conversions():
    """Verify unit conversion helpers."""
    assert kg_to_tonnes(25000.0) == 25.0
    assert tonnes_to_kg(25.0) == 25000.0
    assert mwh_to_kwh(10.0) == 10000.0


def test_model_a_gap_fill_integration(factor_registry):
    """Model A fills missing activity fields, sets data_source=mixed, and engine re-runs."""
    # Input has missing energy_kwh
    activity = SupplierActivityInput(
        supplier_id="sup_steelco",
        name="SteelCo India",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        material_quantity_kg=25000.0,
        energy_kwh=0.0,
        electricity_source=ElectricitySource.GRID_COAL,
        transport_distance_km=400.0,
        transport_mode=TransportMode.ROAD,
        location_label="Mumbai, India",
        latitude=19.076,
        longitude=72.8777,
        production_volume=25.0,
        data_source=DataSource.PRIMARY,
    )

    # Simulated Model A output per docs/ML.md
    gap_fill_response = {
        "supplier_id": "sup_steelco",
        "filled_fields": ["energy_kwh"],
        "energy_kwh": 50000.0,
        "data_source": "modeled",
        "confidence": 0.85,
    }

    updated_activity = apply_gap_fill(activity, gap_fill_response)
    assert updated_activity.energy_kwh == 50000.0
    assert updated_activity.data_source == DataSource.MIXED

    # Re-run engine
    result = calculate_supplier_emissions(updated_activity, registry=factor_registry)
    assert result.energy_co2e_kg == 41000.0
    assert result.total_co2e_kg == 89850.0
    assert result.data_source == DataSource.MIXED


def test_model_a_all_missing_activity_is_modeled():
    """The boundary marks a fully estimated record as modeled, not mixed."""
    activity = SupplierActivityInput(
        name="Empty Supplier", tier=Tier.TIER_1, material_code=MaterialCode.STEEL,
        location_label="Mumbai, India", latitude=19.076, longitude=72.8777,
    )
    updated = apply_gap_fill(activity, {
        "filled_fields": ["energy_kwh", "material_quantity_kg", "transport_distance_km", "production_volume"],
        "energy_kwh": 50000.0,
        "material_quantity_kg": 25000.0,
        "transport_distance_km": 400.0,
        "production_volume": 25.0,
    })
    assert updated.data_source == DataSource.MODELED


def test_model_b_renewable_energy_alternative(factor_registry):
    """Model B proposes renewable_energy; engine calculates exact delta."""
    activity = SupplierActivityInput(
        supplier_id="sup_steelco",
        name="SteelCo India",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        material_quantity_kg=25000.0,
        energy_kwh=50000.0,
        electricity_source=ElectricitySource.GRID_COAL,
        transport_distance_km=400.0,
        transport_mode=TransportMode.ROAD,
        location_label="Mumbai, India",
        latitude=19.076,
        longitude=72.8777,
        production_volume=25.0,
    )

    current_emissions = calculate_supplier_emissions(activity, registry=factor_registry)
    assert current_emissions.total_co2e_kg == 89850.0

    # Apply alternative
    alt_activity, desc = apply_recommendation_alternative(
        activity,
        RecommendationActionType.RENEWABLE_ENERGY,
        {"electricity_source": ElectricitySource.GRID_RENEWABLE},
    )
    assert alt_activity.electricity_source == ElectricitySource.GRID_RENEWABLE

    projected_emissions = calculate_supplier_emissions(alt_activity, registry=factor_registry)
    delta_co2e = current_emissions.total_co2e_kg - projected_emissions.total_co2e_kg
    # Exactly matches rec_steelco_renewable in fixtures/recommendations.json (39,000 kg)
    assert delta_co2e == pytest.approx(39000.0)


def test_model_b_modal_shift_alternative(factor_registry):
    """Model B proposes modal_shift; engine calculates exact delta."""
    activity = SupplierActivityInput(
        supplier_id="sup_aluco",
        name="AluCo Extrusions",
        tier=Tier.TIER_1,
        material_code=MaterialCode.ALUMINIUM,
        material_quantity_kg=8000.0,
        energy_kwh=20000.0,
        electricity_source=ElectricitySource.GRID_MIXED,
        transport_distance_km=1200.0,
        transport_mode=TransportMode.AIR,
        location_label="Pune, India",
        latitude=18.5204,
        longitude=73.8567,
        production_volume=8.0,
    )

    current_emissions = calculate_supplier_emissions(activity, registry=factor_registry)
    assert current_emissions.total_co2e_kg == 82136.0

    alt_activity, desc = apply_recommendation_alternative(
        activity,
        RecommendationActionType.MODAL_SHIFT,
        {"transport_mode": TransportMode.SEA},
    )
    assert alt_activity.transport_mode == TransportMode.SEA

    projected_emissions = calculate_supplier_emissions(alt_activity, registry=factor_registry)
    delta_co2e = current_emissions.total_co2e_kg - projected_emissions.total_co2e_kg
    # Exactly matches rec_aluco_sea in fixtures/recommendations.json (6,384 kg)
    assert delta_co2e == pytest.approx(6384.0)


def test_model_b_local_sourcing_alternative(factor_registry):
    """Model B proposes local sourcing; cuts transport distance by 70%."""
    activity = SupplierActivityInput(
        supplier_id="sup_steelco",
        name="SteelCo India",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        material_quantity_kg=25000.0,
        energy_kwh=50000.0,
        electricity_source=ElectricitySource.GRID_COAL,
        transport_distance_km=400.0,
        transport_mode=TransportMode.ROAD,
        location_label="Mumbai, India",
        latitude=19.076,
        longitude=72.8777,
        production_volume=25.0,
    )

    alt_activity, desc = apply_recommendation_alternative(
        activity,
        RecommendationActionType.LOCAL_SOURCING,
        {"distance_multiplier": 0.3},
    )
    assert alt_activity.transport_distance_km == 120.0
    projected_emissions = calculate_supplier_emissions(alt_activity, registry=factor_registry)
    assert projected_emissions.transport_co2e_kg == pytest.approx(360.0)  # 25 * 120 * 0.12
