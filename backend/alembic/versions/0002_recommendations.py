"""Add recommendations.

Revision ID: 0002_recommendations
Revises: 0001_initial_schema
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_recommendations"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "recommendations",
        sa.Column("recommendation_id", sa.String(), nullable=False),
        sa.Column("org_id", sa.String(), nullable=False),
        sa.Column("supplier_id", sa.String(), nullable=False),
        sa.Column("action_type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("current_co2e_kg", sa.Numeric(), nullable=False),
        sa.Column("projected_co2e_kg", sa.Numeric(), nullable=False),
        sa.Column("delta_co2e_kg", sa.Numeric(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.org_id"]),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.supplier_id"]),
        sa.PrimaryKeyConstraint("recommendation_id"),
    )


def downgrade() -> None:
    op.drop_table("recommendations")
