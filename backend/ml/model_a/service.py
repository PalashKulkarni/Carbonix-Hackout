"""Model A Service: orchestrates activity gap-fill and bridges to the carbon calculation engine.

Principle:
Model A estimates activity. The carbon engine calculates carbon.
"""

import json
from pathlib import Path
from typing import List, Optional, Sequence, Tuple

from backend.engine.calculator import calculate_supplier_emissions
from backend.engine.constants import DataSource
from backend.engine.factors import FactorRegistry
from backend.engine.models import SupplierActivityInput, SupplierEmissionResult

from .base import BaseActivityEstimator
from .peer_group import PeerGroupEstimator
from .schemas import GapFillRequest, GapFillResponse


class ModelAService:
    """Service coordinating activity estimation and carbon engine execution."""

    def __init__(
        self,
        peers: Optional[Sequence[SupplierActivityInput]] = None,
        estimator: Optional[BaseActivityEstimator] = None,
    ):
        self._estimator = estimator or PeerGroupEstimator()
        # ``None`` requests the demo fixture for local development.  An empty
        # sequence is meaningful in production: it says this org has no peer
        # evidence and must use the explicit low-confidence benchmark.
        self._peers: List[SupplierActivityInput] = (
            self._load_default_peers() if peers is None else list(peers)
        )

    def set_peers(self, peers: Sequence[SupplierActivityInput]) -> None:
        """Update the reference peer supplier pool."""
        self._peers = list(peers)

    def gap_fill(self, request: GapFillRequest) -> GapFillResponse:
        """Estimate missing fields using only the requesting org's peer pool."""
        # Model A is invoked during multi-tenant backend ingest.  Never allow
        # an estimate for one buyer to learn from another buyer's suppliers.
        org_peers = [peer for peer in self._peers if peer.org_id == request.org_id]
        return self._estimator.estimate(request, org_peers)

    def fill_supplier_activity(
        self,
        activity: SupplierActivityInput,
        missing_fields: Optional[List[str]] = None,
    ) -> Tuple[SupplierActivityInput, GapFillResponse]:
        """Fill missing activity fields in a SupplierActivityInput.

        Parameters:
            activity: Supplier activity to examine and complete.
            missing_fields: Optional explicit list of fields that are considered missing.
                            If omitted, any target field with value None or zero is estimated.

        Returns:
            Tuple of (completed SupplierActivityInput, GapFillResponse).
        """
        # Determine which fields are missing
        req_kwargs = activity.model_dump()
        target_fields = ["energy_kwh", "material_quantity_kg", "transport_distance_km", "production_volume"]

        for f in target_fields:
            if missing_fields is not None:
                if f in missing_fields:
                    req_kwargs[f] = None
            else:
                # docs/ML.md defines both null and zero activity values as
                # gaps at ingest. Direct GapFillRequest callers receive the
                # same treatment in PeerGroupEstimator.
                val = getattr(activity, f, None)
                if val is None or val == 0:
                    req_kwargs[f] = None

        request = GapFillRequest(**req_kwargs)
        response = self.gap_fill(request)

        # Apply filled fields to activity copy
        updated_dict = activity.model_dump()
        for field in response.filled_fields:
            est_val = getattr(response, field)
            if est_val is not None:
                updated_dict[field] = est_val

        # Update data_source
        if response.filled_fields:
            updated_dict["data_source"] = response.data_source

        completed_activity = SupplierActivityInput(**updated_dict)
        return completed_activity, response

    def fill_and_calculate(
        self,
        activity: SupplierActivityInput,
        missing_fields: Optional[List[str]] = None,
        registry: Optional[FactorRegistry] = None,
        org_id: Optional[str] = None,
        period: str = "2025",
    ) -> Tuple[SupplierEmissionResult, GapFillResponse]:
        """Full pipeline: Ingest -> Model A gap-fill -> Carbon Engine -> Emissions.

        Model A estimates activity. The carbon engine calculates carbon.
        """
        completed_activity, gap_fill_response = self.fill_supplier_activity(
            activity=activity,
            missing_fields=missing_fields,
        )

        # Pass completed activity to the existing carbon engine
        emission_result = calculate_supplier_emissions(
            activity=completed_activity,
            org_id=org_id,
            registry=registry,
            period=period,
        )

        return emission_result, gap_fill_response

    @staticmethod
    def _load_default_peers() -> List[SupplierActivityInput]:
        """Load default peer suppliers from fixtures/suppliers.json."""
        candidates = [
            Path("fixtures/suppliers.json"),
            Path(__file__).parent.parent.parent.parent / "fixtures" / "suppliers.json",
        ]
        fixture_path = None
        for p in candidates:
            if p.is_file():
                fixture_path = p
                break

        if not fixture_path:
            return []

        try:
            with open(fixture_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return [SupplierActivityInput(**item) for item in data["items"]]
        except Exception:
            return []


# Global service instance
_default_model_a_service: Optional[ModelAService] = None


def get_model_a_service() -> ModelAService:
    """Get or initialize the global Model A service."""
    global _default_model_a_service
    if _default_model_a_service is None:
        _default_model_a_service = ModelAService()
    return _default_model_a_service
