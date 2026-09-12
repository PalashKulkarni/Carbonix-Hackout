"""Golden tests verifying engine calculations against fixtures/emissions.json & suppliers.json.

Follows rule in backend.mdc:
'Golden test: sup_steelco totals in fixtures/emissions.json given fixtures/factors.json.'
"""

from typing import Any, Dict, List
import pytest

from backend.engine import (
    FactorRegistry,
    SupplierActivityInput,
    calculate_org_emissions,
    calculate_supplier_emissions,
)


def test_golden_steelco_emissions(
    demo_supplier_inputs: List[SupplierActivityInput],
    emissions_fixture: Dict[str, Any],
    factor_registry: FactorRegistry,
):
    """Golden test: sup_steelco calculation matches fixtures/emissions.json exactly."""
    steelco_input = next(s for s in demo_supplier_inputs if s.supplier_id == "sup_steelco")
    steelco_golden = next(e for e in emissions_fixture["by_supplier"] if e["supplier_id"] == "sup_steelco")

    result = calculate_supplier_emissions(steelco_input, registry=factor_registry)

    assert result.energy_co2e_kg == pytest.approx(steelco_golden["energy_co2e_kg"], rel=1e-4)
    assert result.transport_co2e_kg == pytest.approx(steelco_golden["transport_co2e_kg"], rel=1e-4)
    assert result.material_co2e_kg == pytest.approx(steelco_golden["material_co2e_kg"], rel=1e-4)
    assert result.manufacturing_co2e_kg == pytest.approx(steelco_golden["manufacturing_co2e_kg"], rel=1e-4)
    assert result.logistics_co2e_kg == pytest.approx(steelco_golden["logistics_co2e_kg"], rel=1e-4)
    assert result.total_co2e_kg == pytest.approx(steelco_golden["total_co2e_kg"], rel=1e-4)
    assert result.intensity_kg_per_unit == pytest.approx(steelco_golden["intensity_kg_per_unit"], rel=1e-3)


def test_all_demo_suppliers_golden(
    demo_supplier_inputs: List[SupplierActivityInput],
    suppliers_fixture: Dict[str, Any],
    factor_registry: FactorRegistry,
):
    """Test all 6 demo suppliers calculate exact numbers matching fixtures/suppliers.json."""
    golden_map = {s["supplier_id"]: s for s in suppliers_fixture["items"]}

    # Run org calculation pipeline to compute ranks and risks
    results = calculate_org_emissions(demo_supplier_inputs, registry=factor_registry)
    assert len(results) == 6

    for res in results:
        golden = golden_map[res.supplier_id]
        assert res.energy_co2e_kg == pytest.approx(golden["energy_co2e_kg"], rel=1e-4), f"Energy mismatch for {res.supplier_id}"
        assert res.transport_co2e_kg == pytest.approx(golden["transport_co2e_kg"], rel=1e-4), f"Transport mismatch for {res.supplier_id}"
        assert res.material_co2e_kg == pytest.approx(golden["material_co2e_kg"], rel=1e-4), f"Material mismatch for {res.supplier_id}"
        assert res.manufacturing_co2e_kg == pytest.approx(golden["manufacturing_co2e_kg"], rel=1e-4), f"Mfg mismatch for {res.supplier_id}"
        assert res.logistics_co2e_kg == pytest.approx(golden["logistics_co2e_kg"], rel=1e-4), f"Logistics mismatch for {res.supplier_id}"
        assert res.total_co2e_kg == pytest.approx(golden["total_co2e_kg"], rel=1e-4), f"Total mismatch for {res.supplier_id}"
        assert res.intensity_kg_per_unit == pytest.approx(golden["intensity_kg_per_unit"], rel=1e-2), f"Intensity mismatch for {res.supplier_id}"
        assert res.rank == golden["rank"], f"Rank mismatch for {res.supplier_id}"
        assert res.carbon_risk == golden["carbon_risk"], f"Carbon risk mismatch for {res.supplier_id}"


def test_org_total_emissions(
    demo_supplier_inputs: List[SupplierActivityInput],
    factor_registry: FactorRegistry,
):
    """Test total org emissions sum to 285446.8 kg CO2e."""
    results = calculate_org_emissions(demo_supplier_inputs, registry=factor_registry)
    total_co2e = sum(r.total_co2e_kg for r in results)
    assert total_co2e == pytest.approx(285446.8, rel=1e-4)

