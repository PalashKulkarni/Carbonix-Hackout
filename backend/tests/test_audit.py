"""Unit tests for calculation auditability and breakdown inspection."""

import pytest

from backend.engine import (
    FactorRegistry,
    SupplierActivityInput,
    calculate_supplier_with_audit,
)


def test_audit_breakdown_contains_all_buckets(
    demo_supplier_inputs: list[SupplierActivityInput],
    factor_registry: FactorRegistry,
):
    """Audit result must contain detailed formulas, factor codes, and units for all 5 buckets."""
    steelco = next(s for s in demo_supplier_inputs if s.supplier_id == "sup_steelco")
    res, audit = calculate_supplier_with_audit(steelco, registry=factor_registry)

    assert audit.supplier_id == "sup_steelco"
    assert audit.name == "SteelCo India"
    assert set(audit.buckets.keys()) == {"energy", "material", "transport", "manufacturing", "logistics"}

    # Inspect energy bucket audit
    en_b = audit.buckets["energy"]
    assert en_b.activity_value == 50000.0
    assert en_b.activity_unit == "kWh"
    assert en_b.factor_code == "grid_coal"
    assert en_b.factor_value == 0.82
    assert "50000.0 kWh * 0.82 kg CO2e/kWh" in en_b.formula
    assert en_b.co2e_kg == 41000.0

    # Inspect transport bucket audit
    tr_b = audit.buckets["transport"]
    assert tr_b.activity_value == 10000.0  # 25 tonnes * 400 km
    assert tr_b.activity_unit == "tonne_km"
    assert tr_b.factor_code == "road"
    assert tr_b.factor_value == 0.12
    assert tr_b.co2e_kg == 1200.0

