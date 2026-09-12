"""Audit trail and calculation breakdown utilities for Carbon Calculation Engine.

Provides transparent and traceable calculation details for each category bucket.
"""

from typing import Dict

from .constants import DataSource, EmissionCategory
from .models import AuditBucketDetail, SupplierAuditResult


def build_supplier_audit(
    supplier_id: str | None,
    name: str,
    buckets: Dict[str, AuditBucketDetail],
    total_co2e_kg: float,
    intensity_kg_per_unit: float,
    data_source: DataSource,
) -> SupplierAuditResult:
    """Build a complete auditable trace for a supplier calculation."""
    return SupplierAuditResult(
        supplier_id=supplier_id,
        name=name,
        buckets=buckets,
        total_co2e_kg=total_co2e_kg,
        intensity_kg_per_unit=intensity_kg_per_unit,
        data_source=data_source,
    )

