"""Unit tests for edge cases, validation, and fallbacks."""

import pytest
from pydantic import ValidationError

from backend.engine import (
    DataSource,
    ElectricitySource,
    FactorCategory,
    FactorRegistry,
    MaterialCode,
    SupplierActivityInput,
    Tier,
    TransportMode,
    calculate_supplier_emissions,
    calculate_supplier_with_audit,
)


def test_all_zeros_activity(factor_registry: FactorRegistry):
    """Zero activity values should yield 0 total emissions and 0 intensity without error."""
    activity = SupplierActivityInput(
        name="Zero Emissions Supplier",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        material_quantity_kg=0.0,
        energy_kwh=0.0,
        electricity_source=ElectricitySource.GRID_MIXED,
        transport_distance_km=0.0,
        transport_mode=TransportMode.ROAD,
        location_label="Zero City",
        latitude=0.0,
        longitude=0.0,
        production_volume=0.0,
    )
    result = calculate_supplier_emissions(activity, registry=factor_registry)
    assert result.total_co2e_kg == 0.0
    assert result.intensity_kg_per_unit == 0.0
    assert result.energy_co2e_kg == 0.0
    assert result.material_co2e_kg == 0.0


def test_zero_production_volume_non_zero_emissions(factor_registry: FactorRegistry):
    """Non-zero emissions but zero production volume must result in intensity = 0 (no division by zero)."""
    activity = SupplierActivityInput(
        name="Idle Plant",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        material_quantity_kg=0.0,
        energy_kwh=1000.0,
        electricity_source=ElectricitySource.GRID_MIXED,
        transport_distance_km=0.0,
        transport_mode=TransportMode.ROAD,
        location_label="Idle City",
        latitude=10.0,
        longitude=10.0,
        production_volume=0.0,
    )
    result = calculate_supplier_emissions(activity, registry=factor_registry)
    assert result.energy_co2e_kg == 450.0
    assert result.total_co2e_kg == 450.0
    assert result.intensity_kg_per_unit == 0.0


def test_negative_values_rejected():
    """Negative values for quantities or energy must raise Pydantic ValidationError."""
    with pytest.raises(ValidationError):
        SupplierActivityInput(
            name="Invalid",
            tier=Tier.TIER_1,
            material_code=MaterialCode.STEEL,
            energy_kwh=-10.0,
            location_label="Test",
            latitude=0.0,
            longitude=0.0,
        )


def test_missing_factor_triggers_fallback_and_mixed_data_source():
    """When a factor is missing, registry falls back and marks data_source as mixed."""
    # Create empty registry
    empty_registry = FactorRegistry(factors=[])

    activity = SupplierActivityInput(
        name="Fallback Supplier",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        energy_kwh=100.0,
        electricity_source=ElectricitySource.GRID_COAL,
        location_label="Test",
        latitude=0.0,
        longitude=0.0,
        data_source=DataSource.PRIMARY,
    )

    result, audit = calculate_supplier_with_audit(activity, registry=empty_registry)
    # Since empty registry has no grid_coal, fallback applies and data_source transitions to mixed
    assert result.data_source == DataSource.MIXED
    assert audit.data_source == DataSource.MIXED
    assert audit.buckets["energy"].fallback_applied is True

