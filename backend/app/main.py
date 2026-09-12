import csv
import io
from typing import Any, Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.data import load_fixture
from app.db import Base, SessionLocal, engine, get_db
from app.models import EmissionResult, Supplier
from app.engine_adapter import calculate_and_rank
from app.repository import ORG_ID, all_supplier_dicts, initialize_database, seed_demo, supplier_dict

Base.metadata.create_all(bind=engine)
with SessionLocal() as startup_database:
    initialize_database(startup_database)

app = FastAPI(title="Carbon-Aware Supply Chain API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DemoAuthResponse(BaseModel):
    token: str
    org_id: str
    org_name: str
    email: str


class AuthMeResponse(BaseModel):
    org_id: str
    org_name: str
    email: str


class SupplierCreateRequest(BaseModel):
    name: str
    tier: Literal[1, 2, 3]
    parent_id: str | None = None
    material_code: Literal["steel", "aluminium", "plastic", "cement", "other"]
    material_quantity_kg: float = Field(default=0, ge=0)
    energy_kwh: float = Field(default=0, ge=0)
    electricity_source: Literal["grid_coal", "grid_mixed", "grid_renewable", "onsite_solar"] = "grid_mixed"
    transport_distance_km: float = Field(default=0, ge=0)
    transport_mode: Literal["road", "rail", "sea", "air"] = "road"
    location_label: str
    latitude: float
    longitude: float
    production_volume: float = Field(default=0, ge=0)
    production_unit: str = "tonnes"


class SupplierUpdateRequest(BaseModel):
    name: str | None = None
    tier: Literal[1, 2, 3] | None = None
    parent_id: str | None = None
    material_code: Literal["steel", "aluminium", "plastic", "cement", "other"] | None = None
    material_quantity_kg: float | None = Field(default=None, ge=0)
    energy_kwh: float | None = Field(default=None, ge=0)
    electricity_source: Literal["grid_coal", "grid_mixed", "grid_renewable", "onsite_solar"] | None = None
    transport_distance_km: float | None = Field(default=None, ge=0)
    transport_mode: Literal["road", "rail", "sea", "air"] | None = None
    location_label: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    production_volume: float | None = Field(default=None, ge=0)
    production_unit: str | None = None


CSV_HEADERS = {
    "name", "tier", "parent_name", "material_code", "material_quantity_kg",
    "energy_kwh", "electricity_source", "transport_distance_km", "transport_mode",
    "location_label", "latitude", "longitude", "production_volume", "production_unit",
}


def csv_number(row: dict[str, str], field: str, default: float = 0) -> float:
    value = (row.get(field) or "").strip()
    return default if value == "" else float(value)


def csv_supplier_request(row: dict[str, str], parent_id: str | None) -> SupplierCreateRequest:
    return SupplierCreateRequest(
        name=(row.get("name") or "").strip(),
        tier=int((row.get("tier") or "").strip()),
        parent_id=parent_id,
        material_code=(row.get("material_code") or "").strip(),
        material_quantity_kg=csv_number(row, "material_quantity_kg"),
        energy_kwh=csv_number(row, "energy_kwh"),
        electricity_source=(row.get("electricity_source") or "grid_mixed").strip(),
        transport_distance_km=csv_number(row, "transport_distance_km"),
        transport_mode=(row.get("transport_mode") or "road").strip(),
        location_label=(row.get("location_label") or "").strip(),
        latitude=float((row.get("latitude") or "").strip()),
        longitude=float((row.get("longitude") or "").strip()),
        production_volume=csv_number(row, "production_volume"),
        production_unit=(row.get("production_unit") or "tonnes").strip(),
    )


DEMO_USER = AuthMeResponse(
    org_id="org_apex",
    org_name="Apex Manufacturing",
    email="demo@apex.example",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/demo", response_model=DemoAuthResponse)
def demo_login() -> DemoAuthResponse:
    return DemoAuthResponse(token="demo-token-apex", **DEMO_USER.model_dump())


@app.get("/auth/me", response_model=AuthMeResponse)
def auth_me() -> AuthMeResponse:
    return DEMO_USER


def not_found(message: str) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"error": {"code": "NOT_FOUND", "message": message, "details": []}},
    )


def conflict(message: str) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"error": {"code": "CONFLICT", "message": message, "details": []}},
    )


def validate_supplier_parent(database: Session, tier: int, parent_id: str | None) -> JSONResponse | None:
    if tier == 1 and parent_id is not None:
        return conflict("Tier 1 suppliers must not have a parent_id")
    if tier > 1 and parent_id is None:
        return conflict("Tier 2 and 3 suppliers require a parent_id")
    if parent_id is not None and database.get(Supplier, parent_id) is None:
        return not_found(f"Parent supplier {parent_id} was not found")
    return None


@app.get("/suppliers")
def list_suppliers(
    period: str = Query("2025"),
    tier: int | None = Query(None, ge=1, le=3),
    carbon_risk: str | None = None,
    database: Session = Depends(get_db),
) -> dict[str, Any]:
    items = all_supplier_dicts(database, period)
    if tier is not None:
        items = [item for item in items if item["tier"] == tier]
    if carbon_risk is not None:
        items = [item for item in items if item["carbon_risk"] == carbon_risk]
    return {"items": items, "total": len(items)}


@app.get("/suppliers/{supplier_id}")
def get_supplier(supplier_id: str) -> dict[str, Any]:
    with SessionLocal() as database:
        supplier = database.get(Supplier, supplier_id)
        if supplier is not None:
            result = database.get(EmissionResult, (supplier_id, "2025"))
            return supplier_dict(supplier, result)
    if supplier is None:
        return not_found(f"Supplier {supplier_id} was not found")


@app.get("/suppliers/{supplier_id}/emissions")
def get_supplier_emissions(supplier_id: str, period: str = Query("2025")) -> dict[str, Any]:
    with SessionLocal() as database:
        if database.get(Supplier, supplier_id) is None:
            return not_found(f"Supplier {supplier_id} was not found")
        result = database.get(EmissionResult, (supplier_id, period))
    if result is None:
        return not_found(f"Supplier {supplier_id} was not found")
    return {"supplier_id": supplier_id, **{
        key: getattr(result, key) if key in ("carbon_risk", "rank") else float(getattr(result, key))
        for key in ("energy_co2e_kg", "transport_co2e_kg", "material_co2e_kg", "manufacturing_co2e_kg", "logistics_co2e_kg", "total_co2e_kg", "intensity_kg_per_unit", "carbon_risk", "rank")
    }, "data_source": "primary"}


@app.post("/suppliers/demo")
def load_demo_suppliers(database: Session = Depends(get_db)) -> dict[str, Any]:
    seed_demo(database)
    items = all_supplier_dicts(database)
    return {"items": items, "total": len(items)}


@app.post("/suppliers")
def create_supplier(
    request: SupplierCreateRequest,
    database: Session = Depends(get_db),
) -> Any:
    parent_error = validate_supplier_parent(database, request.tier, request.parent_id)
    if parent_error:
        return parent_error
    supplier = Supplier(
        supplier_id=f"sup_{uuid4().hex[:12]}",
        org_id=ORG_ID,
        data_source="primary",
        **request.model_dump(),
    )
    database.add(supplier)
    database.flush()
    calculate_and_rank(database, "2025")
    database.commit()
    result = database.get(EmissionResult, (supplier.supplier_id, "2025"))
    return supplier_dict(supplier, result)


@app.put("/suppliers/{supplier_id}")
def update_supplier(
    supplier_id: str,
    request: SupplierUpdateRequest,
    database: Session = Depends(get_db),
) -> Any:
    supplier = database.get(Supplier, supplier_id)
    if supplier is None:
        return not_found(f"Supplier {supplier_id} was not found")
    changes = request.model_dump(exclude_unset=True)
    next_tier = changes.get("tier", supplier.tier)
    next_parent = changes.get("parent_id", supplier.parent_id)
    parent_error = validate_supplier_parent(database, next_tier, next_parent)
    if parent_error:
        return parent_error
    for key, value in changes.items():
        setattr(supplier, key, value)
    supplier.data_source = "primary"
    database.flush()
    calculate_and_rank(database, "2025")
    database.commit()
    result = database.get(EmissionResult, (supplier_id, "2025"))
    return supplier_dict(supplier, result)


@app.post("/suppliers/upload")
async def upload_suppliers(
    file: UploadFile = File(...),
    database: Session = Depends(get_db),
) -> Any:
    try:
        contents = await file.read()
        decoded = contents.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded))
        headers = set(reader.fieldnames or [])
        missing_headers = sorted(CSV_HEADERS - headers)
        if missing_headers:
            return JSONResponse(
                status_code=400,
                content={"error": {"code": "VALIDATION_ERROR", "message": "CSV headers are invalid", "details": missing_headers}},
            )
    except (UnicodeDecodeError, csv.Error) as error:
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "VALIDATION_ERROR", "message": str(error), "details": []}},
        )

    existing_by_name = {
        supplier.name: supplier
        for supplier in database.query(Supplier).all()
    }
    created = 0
    updated = 0
    errors: list[dict[str, Any]] = []
    for row_number, row in enumerate(reader, start=2):
        try:
            name = (row.get("name") or "").strip()
            parent_name = (row.get("parent_name") or "").strip()
            tier = int((row.get("tier") or "").strip())
            parent = existing_by_name.get(parent_name) if parent_name else None
            if tier > 1 and parent is None:
                raise ValueError(f"parent_name {parent_name!r} was not found")
            if tier == 1 and parent_name:
                raise ValueError("tier 1 rows must not have parent_name")
            request = csv_supplier_request(row, parent.supplier_id if parent else None)
            existing = existing_by_name.get(name)
            if existing:
                for key, value in request.model_dump(exclude={"parent_id"}).items():
                    setattr(existing, key, value)
                existing.parent_id = request.parent_id
                existing.data_source = "primary"
                updated += 1
            else:
                existing = Supplier(
                    supplier_id=f"sup_{uuid4().hex[:12]}",
                    org_id=ORG_ID,
                    data_source="primary",
                    **request.model_dump(),
                )
                database.add(existing)
                created += 1
            existing_by_name[name] = existing
            database.flush()
        except (ValueError, TypeError) as error:
            errors.append({"row": row_number, "message": str(error)})

    if created or updated:
        calculate_and_rank(database, "2025")
        database.commit()
    items = all_supplier_dicts(database)
    return {"created": created, "updated": updated, "errors": errors, "items": items}


@app.get("/dashboard")
def get_dashboard(period: str = Query("2025")) -> dict[str, Any]:
    return load_fixture("dashboard.json")


@app.get("/rankings")
def get_rankings(
    period: str = Query("2025"),
    sort: str = Query("total", pattern="^(total|intensity)$"),
) -> dict[str, Any]:
    payload = load_fixture("rankings.json")
    if sort == "intensity":
        items = sorted(payload["items"], key=lambda item: item["intensity_kg_per_unit"], reverse=True)
        for rank, item in enumerate(items, start=1):
            item["rank"] = rank
        payload["items"] = items
    payload["sort"] = sort
    return payload


@app.get("/hierarchy")
def get_hierarchy(period: str = Query("2025")) -> dict[str, Any]:
    return load_fixture("hierarchy.json")


@app.get("/map/suppliers")
def get_map_suppliers(period: str = Query("2025")) -> dict[str, Any]:
    return load_fixture("map-suppliers.json")


@app.get("/factors")
def get_factors() -> dict[str, Any]:
    return load_fixture("factors.json")
