"""Comprehensive test suite for Model A: Activity Gap-Fill.

Verifies:
1. Complete data handling (no changes, empty filled_fields, confidence=1.0).
2. Single missing field estimation.
3. Multiple missing fields estimation.
4. Preservation of all user-provided values.
5. Peer-group matching hierarchy (exact -> material -> tier -> global -> fallback).
6. Ratio/intensity scaling.
7. Data-leakage prevention (candidate excluded from peer pool).
8. Data source provenance (primary -> mixed -> modeled).
9. Data-backed, deterministic confidence scoring.
10. End-to-end integration with the existing carbon engine.
11. Separation of concerns: Model A does NOT calculate CO2e.
"""

from typing import List
import pytest
from pydantic import ValidationError

from backend.engine.constants import DataSource, ElectricitySource, MaterialCode, Tier, TransportMode
from backend.engine.factors import FactorRegistry
from backend.engine.models import SupplierActivityInput
from backend.ml.model_a import (
    FieldProvenance,
    GapFillRequest,
    GapFillResponse,
    ModelAService,
    PeerGroupEstimator,
)


@pytest.fixture
def peer_suppliers(demo_supplier_inputs: List[SupplierActivityInput]) -> List[SupplierActivityInput]:
    """Provide reference peer suppliers from demo fixtures."""
    return demo_supplier_inputs


@pytest.fixture
def model_a_service(peer_suppliers: List[SupplierActivityInput]) -> ModelAService:
    """Create ModelAService loaded with reference peers."""
    return ModelAService(peers=peer_suppliers)


def test_complete_data_handling(model_a_service: ModelAService):
    """When all fields are provided, Model A does not alter values and returns empty filled_fields."""
    request = GapFillRequest(
        supplier_id="sup_custom",
        name="Fully Specified Supplier",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        material_quantity_kg=20000.0,
        energy_kwh=40000.0,
        transport_distance_km=350.0,
        production_volume=20.0,
        data_source=DataSource.PRIMARY,
    )

    response = model_a_service.gap_fill(request)

    assert response.filled_fields == []
    assert response.energy_kwh is None
    assert response.material_quantity_kg is None
    assert response.transport_distance_km is None
    assert response.production_volume is None
    assert response.confidence == 1.0
    assert response.data_source == DataSource.PRIMARY

    # Check provenance
    assert response.provenance["energy_kwh"].was_modeled is False
    assert response.provenance["energy_kwh"].original_value == 40000.0


def test_single_missing_field_energy(model_a_service: ModelAService):
    """When only energy_kwh is missing, estimate it and mark data_source=mixed."""
    request = GapFillRequest(
        supplier_id="sup_custom",
        name="Missing Energy Supplier",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        material_quantity_kg=25000.0,
        energy_kwh=None,  # Missing!
        transport_distance_km=400.0,
        production_volume=25.0,  # Contextual production volume provided
        data_source=DataSource.PRIMARY,
    )

    response = model_a_service.gap_fill(request)

    assert response.filled_fields == ["energy_kwh"]
    assert response.energy_kwh is not None
    assert response.energy_kwh > 0
    assert response.data_source == DataSource.MIXED
    assert 0.0 < response.confidence <= 1.0

    # Provenance
    prov = response.provenance["energy_kwh"]
    assert prov.was_modeled is True
    assert prov.original_value is None
    assert prov.estimated_value == response.energy_kwh


def test_zero_activity_is_a_gap(model_a_service: ModelAService):
    """CSV zero sentinels are filled without requiring an explicit field list."""
    request = GapFillRequest(
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        energy_kwh=0.0,
        material_quantity_kg=25000.0,
        transport_distance_km=400.0,
        production_volume=25.0,
    )

    response = model_a_service.gap_fill(request)
    assert response.filled_fields == ["energy_kwh"]
    assert response.energy_kwh == pytest.approx(50000.0)
    assert response.provenance["energy_kwh"].original_value is None


@pytest.mark.parametrize("value", [float("nan"), float("inf"), float("-inf")])
def test_non_finite_activity_is_rejected(value: float):
    """Model A must fail loudly rather than preserve a non-finite activity."""
    with pytest.raises(ValidationError):
        GapFillRequest(energy_kwh=value)


def test_multiple_missing_fields(model_a_service: ModelAService):
    """Multiple missing fields are estimated independently without overwriting existing fields."""
    request = GapFillRequest(
        supplier_id="sup_custom",
        name="Sparse Supplier",
        tier=Tier.TIER_2,
        material_code=MaterialCode.PLASTIC,
        material_quantity_kg=None,  # Missing
        energy_kwh=None,  # Missing
        transport_distance_km=300.0,  # Provided
        production_volume=None,  # Missing
        data_source=DataSource.PRIMARY,
    )

    response = model_a_service.gap_fill(request)

    assert set(response.filled_fields) == {"energy_kwh", "material_quantity_kg", "production_volume"}
    assert response.transport_distance_km is None  # Not filled because it was provided
    assert response.energy_kwh is not None
    assert response.material_quantity_kg is not None
    assert response.production_volume is not None
    assert response.data_source == DataSource.MIXED


def test_all_target_fields_missing(model_a_service: ModelAService):
    """When all 4 activity fields are missing, data_source becomes modeled."""
    request = GapFillRequest(
        supplier_id="sup_empty",
        name="Empty Supplier",
        tier=Tier.TIER_3,
        material_code=MaterialCode.CEMENT,
        material_quantity_kg=None,
        energy_kwh=None,
        transport_distance_km=None,
        production_volume=None,
    )

    response = model_a_service.gap_fill(request)

    assert len(response.filled_fields) == 4
    assert response.data_source == DataSource.MODELED
    assert 0.0 < response.confidence < 1.0


def test_peer_group_ratio_scaled_energy(model_a_service: ModelAService):
    """With steel tier 1, peer is SteelCo (energy: 50,000, volume: 25 -> intensity 2000 kWh/unit).

    If new supplier has production_volume = 10 units, estimated energy should be 20,000 kWh.
    """
    request = GapFillRequest(
        supplier_id="sup_new_steel",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        production_volume=10.0,
        energy_kwh=None,
    )

    response = model_a_service.gap_fill(request)
    assert response.energy_kwh == pytest.approx(20000.0, rel=1e-2)
    assert "intensity_scaled" in response.provenance["energy_kwh"].method


def test_data_leakage_prevention(peer_suppliers: List[SupplierActivityInput]):
    """Target supplier must be excluded from its own estimation pool."""
    estimator = PeerGroupEstimator()

    # sup_steelco in peer pool has energy_kwh = 50,000
    steelco = next(s for s in peer_suppliers if s.supplier_id == "sup_steelco")

    # If we request gap-fill FOR sup_steelco, it must not use its own record
    request = GapFillRequest(
        supplier_id="sup_steelco",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        production_volume=25.0,
        energy_kwh=None,
    )

    response = estimator.estimate(request, peers=peer_suppliers)
    # Since SteelCo was the ONLY steel tier 1 supplier, excluding it forces fallback to material/global
    assert response.provenance["energy_kwh"].peer_sample_size < len(peer_suppliers)
    assert response.provenance["energy_kwh"].method != "peer_exact_intensity_scaled"


def test_novel_material_fallback(model_a_service: ModelAService):
    """Unknown or unobserved material falls back safely without crashing."""
    request = GapFillRequest(
        supplier_id="sup_novel",
        tier=Tier.TIER_1,
        material_code=MaterialCode.OTHER,  # No demo supplier has material 'other'
        energy_kwh=None,
        material_quantity_kg=None,
        transport_distance_km=None,
        production_volume=None,
    )

    response = model_a_service.gap_fill(request)

    # Must produce valid estimates via tier/global fallback
    assert len(response.filled_fields) == 4
    for field in response.filled_fields:
        assert getattr(response, field) > 0
    # Confidence reflects fallback level (lower than exact match)
    assert response.confidence < 0.65


def test_no_peer_data_uses_low_confidence_benchmarks():
    """The final fallback is deterministic, finite, and visibly low confidence."""
    response = PeerGroupEstimator().estimate(
        GapFillRequest(material_code=MaterialCode.OTHER, energy_kwh=None),
        peers=[],
    )
    assert response.energy_kwh == 15000.0
    assert response.provenance["energy_kwh"].method == "default_benchmark"
    assert response.provenance["energy_kwh"].confidence == 0.05


def test_service_respects_an_explicitly_empty_peer_pool():
    """An empty production peer pool must not silently become demo data."""
    response = ModelAService(peers=[]).gap_fill(
        GapFillRequest(tier=Tier.TIER_1, material_code=MaterialCode.STEEL, energy_kwh=None)
    )
    assert response.energy_kwh == 15000.0
    assert response.provenance["energy_kwh"].method == "default_benchmark"


def test_estimation_does_not_mutate_peer_records(peer_suppliers: List[SupplierActivityInput]):
    """Reference inventory is read-only during inference."""
    before = [peer.model_dump() for peer in peer_suppliers]
    PeerGroupEstimator().estimate(
        GapFillRequest(tier=Tier.TIER_1, material_code=MaterialCode.STEEL, energy_kwh=None),
        peer_suppliers,
    )
    assert [peer.model_dump() for peer in peer_suppliers] == before


def test_service_does_not_use_cross_org_peers():
    """An organisation cannot receive an estimate derived from another org's data."""
    foreign_peer = SupplierActivityInput(
        supplier_id="sup_foreign", org_id="org_other", name="Foreign Steel",
        tier=Tier.TIER_1, material_code=MaterialCode.STEEL, energy_kwh=999999.0,
        location_label="City", latitude=0, longitude=0,
    )
    service = ModelAService(peers=[foreign_peer])
    response = service.gap_fill(GapFillRequest(
        org_id="org_apex", tier=Tier.TIER_1, material_code=MaterialCode.STEEL,
        energy_kwh=None,
    ))

    assert response.energy_kwh == 15000.0
    assert response.provenance["energy_kwh"].method == "default_benchmark"


def test_confidence_reflects_sample_size_and_match():
    """Exact match with known peer yields higher confidence than global fallback."""
    estimator = PeerGroupEstimator()

    # Cement tier 2 exists (Cementa Works)
    req_exact = GapFillRequest(
        tier=Tier.TIER_2,
        material_code=MaterialCode.CEMENT,
        transport_distance_km=None,
    )
    # Other tier 1 has no exact match
    req_fallback = GapFillRequest(
        tier=Tier.TIER_1,
        material_code=MaterialCode.OTHER,
        transport_distance_km=None,
    )

    # Simple peer corpus
    peers = [
        SupplierActivityInput(
            name="P1", tier=Tier.TIER_2, material_code=MaterialCode.CEMENT,
            transport_distance_km=200.0, location_label="City", latitude=0, longitude=0,
        ),
    ]

    res_exact = estimator.estimate(req_exact, peers)
    res_fallback = estimator.estimate(req_fallback, peers)

    assert res_exact.confidence > res_fallback.confidence


def test_confidence_penalizes_heterogeneous_peers():
    """Confidence reflects observed uncertainty, not just peer count."""
    estimator = PeerGroupEstimator()
    request = GapFillRequest(tier=Tier.TIER_1, material_code=MaterialCode.STEEL, energy_kwh=None)
    stable = [
        SupplierActivityInput(name=f"S{i}", tier=Tier.TIER_1, material_code=MaterialCode.STEEL,
                              energy_kwh=value, location_label="City", latitude=0, longitude=0)
        for i, value in enumerate((1000.0, 1000.0, 1000.0))
    ]
    variable = [
        SupplierActivityInput(name=f"V{i}", tier=Tier.TIER_1, material_code=MaterialCode.STEEL,
                              energy_kwh=value, location_label="City", latitude=0, longitude=0)
        for i, value in enumerate((100.0, 1000.0, 10000.0))
    ]

    assert estimator.estimate(request, stable).confidence > estimator.estimate(request, variable).confidence


def test_modeled_record_remains_modeled_on_second_fill(model_a_service: ModelAService):
    """Provenance is retained when a previously-modelled record is completed."""
    response = model_a_service.gap_fill(
        GapFillRequest(
            tier=Tier.TIER_1,
            material_code=MaterialCode.STEEL,
            energy_kwh=None,
            material_quantity_kg=25000.0,
            transport_distance_km=400.0,
            production_volume=25.0,
            data_source=DataSource.MODELED,
        )
    )
    assert response.data_source == DataSource.MODELED


def test_service_fill_supplier_activity(model_a_service: ModelAService):
    """ModelAService.fill_supplier_activity seamlessly updates a SupplierActivityInput."""
    raw_activity = SupplierActivityInput(
        supplier_id="sup_partial",
        name="Partial Supplier",
        tier=Tier.TIER_2,
        material_code=MaterialCode.PLASTIC,
        location_label="Chennai, India",
        latitude=13.0,
        longitude=80.0,
        transport_distance_km=300.0,
        production_volume=10.0,
        energy_kwh=0.0,
        material_quantity_kg=0.0,
        data_source=DataSource.PRIMARY,
    )

    completed, resp = model_a_service.fill_supplier_activity(
        activity=raw_activity,
        missing_fields=["energy_kwh", "material_quantity_kg"],
    )

    assert completed.energy_kwh > 0.0
    assert completed.material_quantity_kg > 0.0
    assert completed.transport_distance_km == 300.0  # Preserved
    assert completed.data_source == DataSource.MIXED
    assert set(resp.filled_fields) == {"energy_kwh", "material_quantity_kg"}


def test_fill_and_calculate_end_to_end(
    model_a_service: ModelAService,
    factor_registry: FactorRegistry,
):
    """End-to-End Pipeline: Incomplete input -> Model A gap-fill -> Carbon Engine -> Emissions."""
    raw_activity = SupplierActivityInput(
        supplier_id="sup_incomplete",
        name="Incomplete Plant",
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        material_quantity_kg=25000.0,
        energy_kwh=0.0,  # Missing!
        electricity_source=ElectricitySource.GRID_COAL,
        transport_distance_km=400.0,
        transport_mode=TransportMode.ROAD,
        location_label="Mumbai, India",
        latitude=19.076,
        longitude=72.8777,
        production_volume=25.0,
        data_source=DataSource.PRIMARY,
    )

    # Run fill and calculate
    emission_result, gap_fill = model_a_service.fill_and_calculate(
        activity=raw_activity,
        missing_fields=["energy_kwh"],
        registry=factor_registry,
    )

    # 1. Model A filled energy_kwh
    assert "energy_kwh" in gap_fill.filled_fields
    assert gap_fill.energy_kwh is not None
    assert gap_fill.energy_kwh > 0

    # 2. Engine calculated emissions
    assert emission_result.energy_co2e_kg > 0
    assert emission_result.total_co2e_kg > 0
    assert emission_result.intensity_kg_per_unit > 0
    assert emission_result.data_source == DataSource.MIXED


def test_model_a_does_not_calculate_co2e(model_a_service: ModelAService):
    """Strict separation of concerns: Model A must NEVER return total_co2e_kg in its response."""
    request = GapFillRequest(
        tier=Tier.TIER_1,
        material_code=MaterialCode.STEEL,
        energy_kwh=None,
    )
    response = model_a_service.gap_fill(request)

    # GapFillResponse schema must not contain emission fields
    assert not hasattr(response, "total_co2e_kg")
    assert not hasattr(response, "energy_co2e_kg")
    assert not hasattr(response, "co2e_kg")
