"""Pytest fixtures for Carbon Calculation Engine tests."""

import json
from pathlib import Path
from typing import Any, Dict, List
import pytest

from backend.engine import FactorRegistry, SupplierActivityInput


@pytest.fixture(scope="session")
def repo_root() -> Path:
    """Return repository root path."""
    return Path(__file__).parent.parent.parent


@pytest.fixture(scope="session")
def factors_data(repo_root: Path) -> Dict[str, Any]:
    """Load fixtures/factors.json."""
    with open(repo_root / "fixtures" / "factors.json", "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def suppliers_fixture(repo_root: Path) -> Dict[str, Any]:
    """Load fixtures/suppliers.json."""
    with open(repo_root / "fixtures" / "suppliers.json", "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def emissions_fixture(repo_root: Path) -> Dict[str, Any]:
    """Load fixtures/emissions.json."""
    with open(repo_root / "fixtures" / "emissions.json", "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def factor_registry(repo_root: Path) -> FactorRegistry:
    """Create FactorRegistry initialized from fixtures/factors.json."""
    return FactorRegistry.from_fixture(repo_root / "fixtures" / "factors.json")


@pytest.fixture
def demo_supplier_inputs(suppliers_fixture: Dict[str, Any]) -> List[SupplierActivityInput]:
    """Parse demo suppliers as SupplierActivityInput objects."""
    inputs: List[SupplierActivityInput] = []
    for item in suppliers_fixture["items"]:
        # Extract activity fields
        activity = SupplierActivityInput(
            supplier_id=item["supplier_id"],
            org_id=item["org_id"],
            parent_id=item["parent_id"],
            name=item["name"],
            tier=item["tier"],
            material_code=item["material_code"],
            material_quantity_kg=item["material_quantity_kg"],
            energy_kwh=item["energy_kwh"],
            electricity_source=item["electricity_source"],
            transport_distance_km=item["transport_distance_km"],
            transport_mode=item["transport_mode"],
            location_label=item["location_label"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            production_volume=item["production_volume"],
            production_unit=item["production_unit"],
            data_source=item["data_source"],
        )
        inputs.append(activity)
    return inputs

