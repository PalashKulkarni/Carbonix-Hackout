"""Unit tests for median intensity, carbon risk, and supplier ranking."""

import pytest

from backend.engine.constants import CarbonRisk
from backend.engine.models import SupplierEmissionResult
from backend.engine.risk import (
    assign_ranks_and_risks,
    calculate_org_median_intensity,
    determine_carbon_risk,
)


def test_median_intensity_ignores_zeros():
    """calculate_org_median_intensity ignores 0.0 values."""
    intensities = [0.0, 100.0, 200.0, 300.0, 0.0]
    # non-zero: [100.0, 200.0, 300.0] -> median is 200.0
    assert calculate_org_median_intensity(intensities) == 200.0


def test_determine_carbon_risk_thresholds():
    """Test low, medium, and high classification based on median."""
    median = 1000.0
    # low < 800
    assert determine_carbon_risk(intensity_kg_per_unit=799.0, total_co2e_kg=500, org_total_co2e_kg=10000, median_intensity=median) == CarbonRisk.LOW

    # medium: [800, 1250]
    assert determine_carbon_risk(intensity_kg_per_unit=1000.0, total_co2e_kg=500, org_total_co2e_kg=10000, median_intensity=median) == CarbonRisk.MEDIUM

    # high > 1250
    assert determine_carbon_risk(intensity_kg_per_unit=1251.0, total_co2e_kg=500, org_total_co2e_kg=10000, median_intensity=median) == CarbonRisk.HIGH


def test_determine_carbon_risk_share_override():
    """Supplier >= 15% of org total is overridden to HIGH even with low intensity."""
    median = 1000.0
    # Intensity 500 is low (<800), but share is 1500 / 10000 = 15% -> HIGH
    assert determine_carbon_risk(
        intensity_kg_per_unit=500.0,
        total_co2e_kg=1500.0,
        org_total_co2e_kg=10000.0,
        median_intensity=median,
    ) == CarbonRisk.HIGH


def test_assign_ranks_and_risks_sorting():
    """assign_ranks_and_risks sorts descending and sets 1-based ranks."""
    s1 = SupplierEmissionResult(
        supplier_id="s1",
        energy_co2e_kg=10, transport_co2e_kg=10, material_co2e_kg=10, manufacturing_co2e_kg=10, logistics_co2e_kg=10,
        total_co2e_kg=50.0, intensity_kg_per_unit=10.0,
    )
    s2 = SupplierEmissionResult(
        supplier_id="s2",
        energy_co2e_kg=50, transport_co2e_kg=50, material_co2e_kg=50, manufacturing_co2e_kg=50, logistics_co2e_kg=50,
        total_co2e_kg=250.0, intensity_kg_per_unit=50.0,
    )
    s3 = SupplierEmissionResult(
        supplier_id="s3",
        energy_co2e_kg=20, transport_co2e_kg=20, material_co2e_kg=20, manufacturing_co2e_kg=20, logistics_co2e_kg=20,
        total_co2e_kg=100.0, intensity_kg_per_unit=20.0,
    )

    ranked = assign_ranks_and_risks([s1, s2, s3])
    assert [r.supplier_id for r in ranked] == ["s2", "s3", "s1"]
    assert [r.rank for r in ranked] == [1, 2, 3]

