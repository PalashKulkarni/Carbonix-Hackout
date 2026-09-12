from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Org(Base):
    __tablename__ = "orgs"

    org_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String, primary_key=True)
    org_id: Mapped[str] = mapped_column(ForeignKey("orgs.org_id"), nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    reset_token_id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id: Mapped[str] = mapped_column(String, primary_key=True)
    org_id: Mapped[str] = mapped_column(ForeignKey("orgs.org_id"), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(ForeignKey("suppliers.supplier_id"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    tier: Mapped[int] = mapped_column(Integer, nullable=False)
    material_code: Mapped[str] = mapped_column(String, nullable=False)
    material_quantity_kg: Mapped[Decimal] = mapped_column(Numeric, default=0, nullable=False)
    energy_kwh: Mapped[Decimal] = mapped_column(Numeric, default=0, nullable=False)
    electricity_source: Mapped[str] = mapped_column(String, default="grid_mixed", nullable=False)
    transport_distance_km: Mapped[Decimal] = mapped_column(Numeric, default=0, nullable=False)
    transport_mode: Mapped[str] = mapped_column(String, default="road", nullable=False)
    location_label: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    production_volume: Mapped[Decimal] = mapped_column(Numeric, default=0, nullable=False)
    production_unit: Mapped[str] = mapped_column(String, default="tonnes", nullable=False)
    data_source: Mapped[str] = mapped_column(String, default="primary", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class EmissionFactor(Base):
    __tablename__ = "emission_factors"

    factor_id: Mapped[str] = mapped_column(String, primary_key=True)
    org_id: Mapped[str | None] = mapped_column(ForeignKey("orgs.org_id"))
    factor_category: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str] = mapped_column(String, nullable=False)
    factor_kg_co2e_per_unit: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)


class EmissionResult(Base):
    __tablename__ = "emission_results"

    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.supplier_id"), primary_key=True)
    period: Mapped[str] = mapped_column(String, primary_key=True, default="2025")
    energy_co2e_kg: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    transport_co2e_kg: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    material_co2e_kg: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    manufacturing_co2e_kg: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    logistics_co2e_kg: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    total_co2e_kg: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    intensity_kg_per_unit: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    carbon_risk: Mapped[str] = mapped_column(String, nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id: Mapped[str] = mapped_column(String, primary_key=True)
    org_id: Mapped[str] = mapped_column(ForeignKey("orgs.org_id"), nullable=False)
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.supplier_id"), nullable=False)
    action_type: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    current_co2e_kg: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    projected_co2e_kg: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    delta_co2e_kg: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    status: Mapped[str] = mapped_column(String, default="open", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
