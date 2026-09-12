import json
from pathlib import Path

import pytest

from engine.carbon import calculate_emissions, calculate_rankings

ROOT = Path(__file__).parents[2]


def load_json(name: str) -> dict:
    return json.loads((ROOT / "fixtures" / name).read_text())


def factor_map() -> dict[tuple[str, str], float]:
    return {
        (item["factor_category"], item["code"]): item["factor_kg_co2e_per_unit"]
        for item in load_json("factors.json")["items"]
    }


def test_fixture_emissions_match_engine():
    suppliers = load_json("suppliers.json")["items"]
    expected = {
        row["supplier_id"]: row for row in load_json("emissions.json")["by_supplier"]
    }

    for supplier in suppliers:
        actual = calculate_emissions(supplier, factor_map())
        golden = expected[supplier["supplier_id"]]
        for bucket in (
            "energy_co2e_kg",
            "transport_co2e_kg",
            "material_co2e_kg",
            "manufacturing_co2e_kg",
            "logistics_co2e_kg",
            "total_co2e_kg",
            "intensity_kg_per_unit",
        ):
            tolerance = 0.01 if bucket == "intensity_kg_per_unit" else 1e-9
            assert actual[bucket] == pytest.approx(golden[bucket], abs=tolerance)


def test_fixture_ranking_and_risk_match_engine():
    suppliers = load_json("suppliers.json")["items"]
    rows = []
    for supplier in suppliers:
        row = {"supplier_id": supplier["supplier_id"], **calculate_emissions(supplier, factor_map())}
        rows.append(row)

    actual = calculate_rankings(rows)
    expected = load_json("emissions.json")["by_supplier"]

    assert [row["supplier_id"] for row in actual] == [row["supplier_id"] for row in expected]
    assert [row["rank"] for row in actual] == [row["rank"] for row in expected]
    assert [row["carbon_risk"] for row in actual] == [row["carbon_risk"] for row in expected]
