"""Unit tests for what-if scenario simulations."""

from typing import List
import pytest

from backend.engine import (
    FactorRegistry,
    ScenarioInput,
    SupplierActivityInput,
    simulate_scenario,
)


def test_scenario_simulation_zero_sliders(
    demo_supplier_inputs: List[SupplierActivityInput],
    factor_registry: FactorRegistry,
):
    """Zero slider values should result in zero delta."""
    scenario = ScenarioInput(
        period="2025",
        recycled_material_pct=0.0,
        renewable_energy_pct=0.0,
        rail_transport_pct=0.0,
    )
    result = simulate_scenario(demo_supplier_inputs, scenario, registry=factor_registry)
    assert result.delta_co2e_kg == pytest.approx(0.0)
    assert result.delta_pct == pytest.approx(0.0)
    assert result.current_total_co2e_kg == result.projected_total_co2e_kg


def test_scenario_simulation_material_and_transport(
    demo_supplier_inputs: List[SupplierActivityInput],
    factor_registry: FactorRegistry,
):
    """Test scenario with sliders matching material and transport formulas."""
    scenario = ScenarioInput(
        period="2025",
        recycled_material_pct=40.0,
        renewable_energy_pct=60.0,
        rail_transport_pct=50.0,
    )
    result = simulate_scenario(demo_supplier_inputs, scenario, registry=factor_registry)

    # Material projected should match blended recycled factor calculation
    mat_cat = next(c for c in result.by_category if c.emission_category == "material")
    assert mat_cat.current_co2e_kg == pytest.approx(199170.0, rel=1e-4)
    assert mat_cat.projected_co2e_kg == pytest.approx(141622.0, rel=1e-4)

    # Transport projected should match 50% shift to rail
    tr_cat = next(c for c in result.by_category if c.emission_category == "transport")
    assert tr_cat.current_co2e_kg == pytest.approx(8698.8, rel=1e-4)
    assert tr_cat.projected_co2e_kg == pytest.approx(4854.75, rel=1e-4)

    # Total reduction should be positive
    assert result.delta_co2e_kg > 0
    assert result.delta_pct > 0

