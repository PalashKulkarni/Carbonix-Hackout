import csv
import io
import sys
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import Depends, FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

try:
    from engine import SupplierActivityInput
except ModuleNotFoundError:
    from backend.engine import SupplierActivityInput
from app.data import load_fixture
from app.db import Base, SessionLocal, engine, get_db
from app.models import EmissionFactor, EmissionResult, Recommendation, Supplier
from app.engine_adapter import calculate_and_rank
from app.model_a_adapter import fill_activity
from app.repository import (
    ORG_ID,
    all_supplier_dicts,
    dashboard,
    hierarchy,
    initialize_database,
    map_suppliers,
    rankings,
    seed_demo,
    supplier_dict,
)
from app.recommendations import recommendation_dict, refresh_recommendations

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


class FactorUpdateRequest(BaseModel):
    factor_kg_co2e_per_unit: float = Field(ge=0)
    source: str
    year: int = Field(ge=1900, le=2100)


class RecommendationStatusUpdate(BaseModel):
    status: Literal["open", "accepted", "dismissed", "in_progress"]


class ScenarioSimulationRequest(BaseModel):
    period: str = "2025"
    recycled_material_pct: float = Field(default=0, ge=0, le=100)
    renewable_energy_pct: float = Field(default=0, ge=0, le=100)
    rail_transport_pct: float = Field(default=0, ge=0, le=100)


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


def supplier_input_from_request(
    request: SupplierCreateRequest,
    supplier_id: str,
) -> SupplierActivityInput:
    return SupplierActivityInput(
        supplier_id=supplier_id,
        org_id=ORG_ID,
        parent_id=request.parent_id,
        name=request.name,
        tier=request.tier,
        material_code=request.material_code,
        material_quantity_kg=request.material_quantity_kg,
        energy_kwh=request.energy_kwh,
        electricity_source=request.electricity_source,
        transport_distance_km=request.transport_distance_km,
        transport_mode=request.transport_mode,
        location_label=request.location_label,
        latitude=request.latitude,
        longitude=request.longitude,
        production_volume=request.production_volume,
        production_unit=request.production_unit,
        data_source="primary",
    )


def supplier_input_from_model(supplier: Supplier) -> SupplierActivityInput:
    return SupplierActivityInput(
        supplier_id=supplier.supplier_id,
        org_id=supplier.org_id,
        parent_id=supplier.parent_id,
        name=supplier.name,
        tier=supplier.tier,
        material_code=supplier.material_code,
        material_quantity_kg=float(supplier.material_quantity_kg),
        energy_kwh=float(supplier.energy_kwh),
        electricity_source=supplier.electricity_source,
        transport_distance_km=float(supplier.transport_distance_km),
        transport_mode=supplier.transport_mode,
        location_label=supplier.location_label,
        latitude=float(supplier.latitude),
        longitude=float(supplier.longitude),
        production_volume=float(supplier.production_volume),
        production_unit=supplier.production_unit,
        data_source=supplier.data_source,
    )


def apply_completed_activity(supplier: Supplier, activity: SupplierActivityInput) -> None:
    for field in (
        "material_quantity_kg", "energy_kwh", "electricity_source", "transport_distance_km",
        "transport_mode", "production_volume", "production_unit", "data_source",
    ):
        setattr(supplier, field, getattr(activity, field))


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
    supplier_id = f"sup_{uuid4().hex[:12]}"
    completed_activity = fill_activity(
        database,
        supplier_input_from_request(request, supplier_id),
    )
    supplier = Supplier(
        supplier_id=supplier_id,
        org_id=ORG_ID,
        parent_id=request.parent_id,
        name=request.name,
        tier=request.tier,
        material_code=request.material_code,
        location_label=request.location_label,
        latitude=request.latitude,
        longitude=request.longitude,
    )
    apply_completed_activity(supplier, completed_activity)
    database.add(supplier)
    database.flush()
    calculate_and_rank(database, "2025")
    refresh_recommendations(database, "2025")
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
    completed_activity = fill_activity(database, supplier_input_from_model(supplier))
    apply_completed_activity(supplier, completed_activity)
    database.flush()
    calculate_and_rank(database, "2025")
    refresh_recommendations(database, "2025")
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
                completed_activity = fill_activity(database, supplier_input_from_model(existing))
                apply_completed_activity(existing, completed_activity)
                updated += 1
            else:
                supplier_id = f"sup_{uuid4().hex[:12]}"
                completed_activity = fill_activity(
                    database,
                    supplier_input_from_request(request, supplier_id),
                )
                existing = Supplier(
                    supplier_id=supplier_id,
                    org_id=ORG_ID,
                    parent_id=request.parent_id,
                    name=request.name,
                    tier=request.tier,
                    material_code=request.material_code,
                    location_label=request.location_label,
                    latitude=request.latitude,
                    longitude=request.longitude,
                )
                apply_completed_activity(existing, completed_activity)
                database.add(existing)
                created += 1
            existing_by_name[name] = existing
            database.flush()
        except (ValueError, TypeError) as error:
            errors.append({"row": row_number, "message": str(error)})

    if created or updated:
        calculate_and_rank(database, "2025")
        refresh_recommendations(database, "2025")
        database.commit()
    items = all_supplier_dicts(database)
    return {"created": created, "updated": updated, "errors": errors, "items": items}


@app.get("/dashboard")
def get_dashboard(period: str = Query("2025"), database: Session = Depends(get_db)) -> dict[str, Any]:
    return dashboard(database, period)


@app.get("/rankings")
def get_rankings(
    period: str = Query("2025"),
    sort: str = Query("total", pattern="^(total|intensity)$"),
    database: Session = Depends(get_db),
) -> dict[str, Any]:
    return rankings(database, period, sort)


@app.get("/hierarchy")
def get_hierarchy(period: str = Query("2025"), database: Session = Depends(get_db)) -> dict[str, Any]:
    return hierarchy(database, period)


@app.get("/map/suppliers")
def get_map_suppliers(period: str = Query("2025"), database: Session = Depends(get_db)) -> dict[str, Any]:
    return map_suppliers(database, period)


def factor_dict(factor: EmissionFactor) -> dict[str, Any]:
    return {
        "factor_id": factor.factor_id,
        "org_id": factor.org_id,
        "factor_category": factor.factor_category,
        "code": factor.code,
        "factor_kg_co2e_per_unit": float(factor.factor_kg_co2e_per_unit),
        "unit": factor.unit,
        "source": factor.source,
        "year": factor.year,
    }


@app.get("/factors")
def get_factors(database: Session = Depends(get_db)) -> dict[str, Any]:
    factors = database.query(EmissionFactor).order_by(EmissionFactor.factor_id).all()
    return {"items": [factor_dict(factor) for factor in factors], "total": len(factors)}


@app.put("/factors/{factor_id}")
def update_factor(
    factor_id: str,
    request: FactorUpdateRequest,
    database: Session = Depends(get_db),
) -> Any:
    factor = database.get(EmissionFactor, factor_id)
    if factor is None:
        return not_found(f"Factor {factor_id} was not found")
    factor.factor_kg_co2e_per_unit = request.factor_kg_co2e_per_unit
    factor.source = request.source
    factor.year = request.year
    database.flush()
    calculate_and_rank(database, "2025")
    refresh_recommendations(database, "2025")
    database.commit()
    return factor_dict(factor)


@app.get("/recommendations")
def get_recommendations(
    period: str = Query("2025"),
    supplier_id: str | None = None,
    database: Session = Depends(get_db),
) -> dict[str, Any]:
    query = database.query(Recommendation).order_by(Recommendation.delta_co2e_kg.desc())
    if supplier_id:
        query = query.filter(Recommendation.supplier_id == supplier_id)
    items = [recommendation_dict(item) for item in query.all()]
    return {"period": period, "items": items, "total": len(items)}


@app.get("/suppliers/{supplier_id}/recommendations")
def get_supplier_recommendations(
    supplier_id: str,
    database: Session = Depends(get_db),
) -> dict[str, Any]:
    if database.get(Supplier, supplier_id) is None:
        return not_found(f"Supplier {supplier_id} was not found")
    items = [recommendation_dict(item) for item in database.query(Recommendation).filter(
        Recommendation.supplier_id == supplier_id
    ).order_by(Recommendation.delta_co2e_kg.desc()).all()]
    return {"items": items, "total": len(items)}


@app.patch("/recommendations/{recommendation_id}")
def update_recommendation_status(
    recommendation_id: str,
    request: RecommendationStatusUpdate,
    database: Session = Depends(get_db),
) -> Any:
    recommendation = database.get(Recommendation, recommendation_id)
    if recommendation is None:
        return not_found(f"Recommendation {recommendation_id} was not found")
    recommendation.status = request.status
    database.commit()
    return recommendation_dict(recommendation)


@app.post("/scenarios/simulate")
def simulate_scenario(
    request: ScenarioSimulationRequest,
    database: Session = Depends(get_db),
) -> dict[str, Any]:
    suppliers = database.scalars(select(Supplier)).all()
    factors = factor_registry(database)

    current_total = 0.0
    projected_total = 0.0

    for supplier in suppliers:
        act = supplier_input_from_model(supplier)
        try:
            from engine.carbon import calculate_emissions
        except ModuleNotFoundError:
            from backend.engine.carbon import calculate_emissions

        # Current calculation
        current_res = calculate_emissions(
            {
                "material_quantity_kg": supplier.material_quantity_kg,
                "energy_kwh": supplier.energy_kwh,
                "electricity_source": supplier.electricity_source,
                "transport_distance_km": supplier.transport_distance_km,
                "transport_mode": supplier.transport_mode,
                "material_code": supplier.material_code,
                "production_volume": supplier.production_volume,
            },
            factor_map := {
                (factor.factor_category, factor.code): float(factor.factor_kg_co2e_per_unit)
                for factor in database.scalars(select(EmissionFactor)).all()
            },
        )
        current_total += current_res["total_co2e_kg"]

        # Calculate scenario adjusted activity
        sim_mat_code = supplier.material_code
        sim_energy = supplier.energy_kwh
        sim_elec = supplier.electricity_source
        sim_transport_mode = supplier.transport_mode

        if request.recycled_material_pct > 0 and supplier.material_code in {"steel", "aluminium", "plastic"}:
            sim_mat_code = f"recycled_{supplier.material_code}"

        if request.renewable_energy_pct > 0 and supplier.electricity_source in {"grid_coal", "grid_mixed"}:
            sim_elec = "grid_renewable"

        if request.rail_transport_pct > 0 and supplier.transport_mode in {"road", "air"}:
            sim_transport_mode = "rail"

        proj_res = calculate_emissions(
            {
                "material_quantity_kg": supplier.material_quantity_kg,
                "energy_kwh": sim_energy,
                "electricity_source": sim_elec,
                "transport_distance_km": supplier.transport_distance_km,
                "transport_mode": sim_transport_mode,
                "material_code": sim_mat_code,
                "production_volume": supplier.production_volume,
            },
            factor_map,
        )

        # Weighted blend based on user percentages
        mat_weight = request.recycled_material_pct / 100.0
        nrg_weight = request.renewable_energy_pct / 100.0
        trans_weight = request.rail_transport_pct / 100.0
        avg_weight = max(mat_weight, nrg_weight, trans_weight)

        supplier_projected = current_res["total_co2e_kg"] * (1 - avg_weight) + proj_res["total_co2e_kg"] * avg_weight
        projected_total += supplier_projected

    delta = current_total - projected_total
    delta_pct = (delta / current_total * 100.0) if current_total > 0 else 0.0

    return {
        "period": request.period,
        "recycled_material_pct": request.recycled_material_pct,
        "renewable_energy_pct": request.renewable_energy_pct,
        "rail_transport_pct": request.rail_transport_pct,
        "current_total_co2e_kg": round(current_total, 1),
        "projected_total_co2e_kg": round(projected_total, 1),
        "delta_co2e_kg": round(delta, 1),
        "delta_pct": round(delta_pct, 2),
    }

