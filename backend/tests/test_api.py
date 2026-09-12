from pathlib import Path

from fastapi.testclient import TestClient
import pytest

from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_demo_data():
    client.post("/suppliers/demo", json={})


def test_demo_login_matches_contract():
    response = client.post("/auth/demo", json={})

    assert response.status_code == 200
    assert response.json() == {
        "token": "demo-token-apex",
        "org_id": "org_apex",
        "org_name": "Apex Manufacturing",
        "email": "demo@apex.example",
    }


def test_suppliers_returns_fixture_shape():
    response = client.get("/suppliers", params={"period": "2025"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 6
    assert payload["items"][0]["supplier_id"] == "sup_steelco"


def test_supplier_detail_returns_404_for_unknown_id():
    response = client.get("/suppliers/does-not-exist")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_dashboard_and_rankings_use_contract_shapes():
    dashboard = client.get("/dashboard", params={"period": "2025"})
    rankings = client.get("/rankings", params={"period": "2025", "sort": "intensity"})

    assert dashboard.status_code == 200
    assert dashboard.json()["total_co2e_kg"] == 285446.8
    assert rankings.status_code == 200
    assert rankings.json()["items"][0]["supplier_id"] == "sup_aluco"


def test_supplier_create_and_update_recalculate_emissions():
    created = client.post(
        "/suppliers",
        json={
            "name": "Test Steel Supplier",
            "tier": 1,
            "material_code": "steel",
            "material_quantity_kg": 1000,
            "energy_kwh": 100,
            "location_label": "Delhi, India",
            "latitude": 28.6139,
            "longitude": 77.209,
            "production_volume": 1,
        },
    )

    assert created.status_code == 200
    supplier = created.json()
    assert supplier["supplier_id"].startswith("sup_")
    assert supplier["total_co2e_kg"] == 1951

    updated = client.put(
        f"/suppliers/{supplier['supplier_id']}",
        json={"energy_kwh": 200},
    )

    assert updated.status_code == 200
    assert updated.json()["total_co2e_kg"] == 1996


def test_supplier_create_rejects_missing_parent_for_tier_two():
    response = client.post(
        "/suppliers",
        json={
            "name": "Invalid Tier Two",
            "tier": 2,
            "material_code": "steel",
            "location_label": "Delhi, India",
            "latitude": 28.6139,
            "longitude": 77.209,
        },
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"


def test_csv_upload_updates_demo_suppliers():
    csv_path = Path(__file__).parents[2] / "fixtures" / "suppliers.csv"
    response = client.post(
        "/suppliers/upload",
        files={"file": ("suppliers.csv", csv_path.read_bytes(), "text/csv")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["created"] == 0
    assert payload["updated"] == 6
    assert payload["errors"] == []
    assert payload["items"][0]["supplier_id"] == "sup_steelco"


def test_csv_upload_resolves_parents_in_earlier_rows():
    content = (
        "name,tier,parent_name,material_code,material_quantity_kg,energy_kwh,electricity_source,"
        "transport_distance_km,transport_mode,location_label,latitude,longitude,production_volume,production_unit\n"
        "CSV Parent,1,,steel,100,100,grid_mixed,10,road,Delhi,28.6,77.2,1,tonnes\n"
        "CSV Child,2,CSV Parent,plastic,100,100,grid_mixed,10,road,Delhi,28.6,77.2,1,tonnes\n"
    ).encode()
    response = client.post("/suppliers/upload", files={"file": ("rows.csv", content, "text/csv")})

    assert response.status_code == 200
    assert response.json()["created"] == 2
    assert response.json()["errors"] == []
