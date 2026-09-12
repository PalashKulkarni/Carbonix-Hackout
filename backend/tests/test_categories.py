"""Unit tests for category-specific calculation modules."""

import pytest

from backend.engine.categories import (
    calculate_energy_emissions,
    calculate_logistics_emissions,
    calculate_manufacturing_emissions,
    calculate_material_emissions,
    calculate_transport_emissions,
)
from backend.engine.constants import (
    DEFAULT_LAST_MILE_KM,
    ElectricitySource,
    EmissionCategory,
    MaterialCode,
    TransportMode,
)
from backend.engine.factors import FactorRegistry


def test_energy_calculation_grid_coal(factor_registry: FactorRegistry):
    """Energy: 50,000 kWh on grid_coal (0.82) -> 41,000 kg."""
    co2e_kg, audit = calculate_energy_emissions(
        energy_kwh=50000,
        electricity_source=ElectricitySource.GRID_COAL,
        registry=factor_registry,
    )
    assert co2e_kg == pytest.approx(41000.0)
    assert audit.category == EmissionCategory.ENERGY
    assert audit.factor_code == "grid_coal"
    assert audit.factor_value == 0.82


def test_energy_calculation_renewable(factor_registry: FactorRegistry):
    """Energy: 4,000 kWh on grid_renewable (0.04) -> 160 kg."""
    co2e_kg, audit = calculate_energy_emissions(
        energy_kwh=4000,
        electricity_source=ElectricitySource.GRID_RENEWABLE,
        registry=factor_registry,
    )
    assert co2e_kg == pytest.approx(160.0)
    assert audit.factor_code == "grid_renewable"


def test_material_calculation_steel(factor_registry: FactorRegistry):
    """Material: 25,000 kg steel (1.85) -> 46,250 kg."""
    co2e_kg, audit = calculate_material_emissions(
        material_quantity_kg=25000,
        material_code=MaterialCode.STEEL,
        registry=factor_registry,
    )
    assert co2e_kg == pytest.approx(46250.0)
    assert audit.category == EmissionCategory.MATERIAL
    assert audit.factor_code == "steel"


def test_material_calculation_aluminium(factor_registry: FactorRegistry):
    """Material: 8,000 kg aluminium (8.24) -> 65,920 kg."""
    co2e_kg, audit = calculate_material_emissions(
        material_quantity_kg=8000,
        material_code=MaterialCode.ALUMINIUM,
        registry=factor_registry,
    )
    assert co2e_kg == pytest.approx(65920.0)


def test_transport_calculation_road(factor_registry: FactorRegistry):
    """Transport: 25,000 kg (25 tonnes), 400 km road (0.12) -> 1,200 kg."""
    co2e_kg, audit = calculate_transport_emissions(
        material_quantity_kg=25000,
        transport_distance_km=400,
        transport_mode=TransportMode.ROAD,
        registry=factor_registry,
    )
    # tonne_km = 25 * 400 = 10,000; co2e = 10,000 * 0.12 = 1,200
    assert co2e_kg == pytest.approx(1200.0)
    assert audit.activity_value == pytest.approx(10000.0)
    assert audit.activity_unit == "tonne_km"


def test_transport_calculation_air(factor_registry: FactorRegistry):
    """Transport: 8,000 kg (8 tonnes), 1,200 km air (0.68) -> 6,528 kg."""
    co2e_kg, audit = calculate_transport_emissions(
        material_quantity_kg=8000,
        transport_distance_km=1200,
        transport_mode=TransportMode.AIR,
        registry=factor_registry,
    )
    # tonne_km = 8 * 1200 = 9,600; co2e = 9,600 * 0.68 = 6,528
    assert co2e_kg == pytest.approx(6528.0)


def test_manufacturing_calculation(factor_registry: FactorRegistry):
    """Manufacturing: 25 units volume, mfg_steel (50) -> 1,250 kg."""
    co2e_kg, audit = calculate_manufacturing_emissions(
        production_volume=25,
        material_code=MaterialCode.STEEL,
        registry=factor_registry,
    )
    assert co2e_kg == pytest.approx(1250.0)
    assert audit.factor_code == "mfg_steel"


def test_logistics_calculation(factor_registry: FactorRegistry):
    """Logistics: 25,000 kg (25 tonnes), 50 km last-mile, road (0.12) -> 150 kg."""
    co2e_kg, audit = calculate_logistics_emissions(
        material_quantity_kg=25000,
        last_mile_km=DEFAULT_LAST_MILE_KM,
        registry=factor_registry,
    )
    # tonne_km = 25 * 50 = 1,250; co2e = 1,250 * 0.12 = 150
    assert co2e_kg == pytest.approx(150.0)

