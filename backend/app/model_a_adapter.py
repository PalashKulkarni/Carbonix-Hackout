from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

try:
    from engine import SupplierActivityInput
    from ml.model_a.service import ModelAService
except ModuleNotFoundError:
    from backend.engine import SupplierActivityInput
    from backend.ml.model_a.service import ModelAService

from app.engine_adapter import supplier_activity
from app.models import Supplier


def fill_activity(
    database: Session,
    activity: SupplierActivityInput,
) -> SupplierActivityInput:
    """Fill missing activity using only suppliers from the same organization."""
    peers = [
        supplier_activity(supplier)
        for supplier in database.scalars(
            select(Supplier).where(Supplier.org_id == activity.org_id)
        ).all()
        if supplier.supplier_id != activity.supplier_id
    ]
    service = ModelAService(peers=peers)
    completed, _ = service.fill_supplier_activity(activity)
    return completed
