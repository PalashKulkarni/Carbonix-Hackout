"""Abstract base class for Model A activity estimators.

Enables drop-in replacement of the estimation engine (e.g., swapping V1
peer-group heuristics with LightGBM or Random Forest) without touching
the rest of the backend ingestion architecture.
"""

from abc import ABC, abstractmethod
from typing import Sequence

from backend.engine.models import SupplierActivityInput

from .schemas import GapFillRequest, GapFillResponse


class BaseActivityEstimator(ABC):
    """Abstract interface for activity gap-fill estimators."""

    @abstractmethod
    def estimate(
        self,
        request: GapFillRequest,
        peers: Sequence[SupplierActivityInput],
    ) -> GapFillResponse:
        """Estimate missing activity fields for a supplier given a corpus of peer suppliers.

        Parameters:
            request: The supplier activity containing one or more missing fields.
            peers: Reference/historical supplier records used for comparison.

        Returns:
            GapFillResponse containing filled fields, data_source, and confidence.
        """
        raise NotImplementedError

