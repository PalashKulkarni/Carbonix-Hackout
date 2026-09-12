"""Create the initial backend schema.

Revision ID: 0001_initial_schema
Revises:
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "orgs",
        sa.Column("org_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("org_id"),
    )
    op.create_table(
        "users",
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("org_id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.org_id"]),
        sa.PrimaryKeyConstraint("user_id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "suppliers",
        sa.Column("supplier_id", sa.String(), nullable=False),
        sa.Column("org_id", sa.String(), nullable=False),
        sa.Column("parent_id", sa.String(), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("tier", sa.Integer(), nullable=False),
        sa.Column("material_code", sa.String(), nullable=False),
        sa.Column("material_quantity_kg", sa.Numeric(), nullable=False),
        sa.Column("energy_kwh", sa.Numeric(), nullable=False),
        sa.Column("electricity_source", sa.String(), nullable=False),
        sa.Column("transport_distance_km", sa.Numeric(), nullable=False),
        sa.Column("transport_mode", sa.String(), nullable=False),
        sa.Column("location_label", sa.String(), nullable=False),
        sa.Column("latitude", sa.Numeric(), nullable=False),
        sa.Column("longitude", sa.Numeric(), nullable=False),
        sa.Column("production_volume", sa.Numeric(), nullable=False),
        sa.Column("production_unit", sa.String(), nullable=False),
        sa.Column("data_source", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.org_id"]),
        sa.ForeignKeyConstraint(["parent_id"], ["suppliers.supplier_id"]),
        sa.PrimaryKeyConstraint("supplier_id"),
    )
    op.create_table(
        "emission_factors",
        sa.Column("factor_id", sa.String(), nullable=False),
        sa.Column("org_id", sa.String(), nullable=True),
        sa.Column("factor_category", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("factor_kg_co2e_per_unit", sa.Numeric(), nullable=False),
        sa.Column("unit", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.org_id"]),
        sa.PrimaryKeyConstraint("factor_id"),
    )
    op.create_table(
        "emission_results",
        sa.Column("supplier_id", sa.String(), nullable=False),
        sa.Column("period", sa.String(), nullable=False),
        sa.Column("energy_co2e_kg", sa.Numeric(), nullable=False),
        sa.Column("transport_co2e_kg", sa.Numeric(), nullable=False),
        sa.Column("material_co2e_kg", sa.Numeric(), nullable=False),
        sa.Column("manufacturing_co2e_kg", sa.Numeric(), nullable=False),
        sa.Column("logistics_co2e_kg", sa.Numeric(), nullable=False),
        sa.Column("total_co2e_kg", sa.Numeric(), nullable=False),
        sa.Column("intensity_kg_per_unit", sa.Numeric(), nullable=False),
        sa.Column("carbon_risk", sa.String(), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("calculated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.supplier_id"]),
        sa.PrimaryKeyConstraint("supplier_id", "period"),
    )


def downgrade() -> None:
    op.drop_table("emission_results")
    op.drop_table("emission_factors")
    op.drop_table("suppliers")
    op.drop_table("users")
    op.drop_table("orgs")
