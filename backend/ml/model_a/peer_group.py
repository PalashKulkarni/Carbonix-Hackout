"""Explainable, deterministic peer-group activity estimator for Model A.

Follows docs/ML.md and docs/CARBON_ENGINE.md:
- Peer hierarchy: (material_code, tier) -> material_code -> tier -> global corpus -> default.
- Ratio-scaled estimation when contextual quantities (production_volume, material_quantity_kg) exist.
- Evidence-based confidence based on peer support and observed dispersion.
- Strict data-leakage prevention (excludes candidate supplier from peer pool).
"""

import math
import statistics
from typing import Dict, List, Optional, Sequence, Tuple

from backend.engine.constants import DataSource, MaterialCode, Tier
from backend.engine.models import SupplierActivityInput

from .base import BaseActivityEstimator
from .schemas import FieldProvenance, GapFillRequest, GapFillResponse


# Safe fallback defaults if corpus is completely empty
DEFAULT_ACTIVITY_VALUES: Dict[str, float] = {
    "material_quantity_kg": 10000.0,
    "energy_kwh": 15000.0,
    "transport_distance_km": 300.0,
    "production_volume": 10.0,
}


class PeerGroupEstimator(BaseActivityEstimator):
    """V1 Peer-group estimator using material and tier peer clusters."""

    TARGET_FIELDS = [
        "energy_kwh",
        "material_quantity_kg",
        "transport_distance_km",
        "production_volume",
    ]

    @staticmethod
    def _positive_finite(value: object) -> bool:
        """Accept only valid observed peer activity, never NaN or infinity."""
        try:
            return math.isfinite(float(value)) and float(value) > 0
        except (TypeError, ValueError):
            return False

    def estimate(
        self,
        request: GapFillRequest,
        peers: Sequence[SupplierActivityInput],
    ) -> GapFillResponse:
        """Estimate missing fields for the supplier request using peer groups."""
        # 1. Exclude the target supplier to avoid data leakage
        clean_peers = [
            p for p in peers
            if not (request.supplier_id and p.supplier_id == request.supplier_id)
        ]

        filled_fields: List[str] = []
        filled_values: Dict[str, Optional[float]] = {f: None for f in self.TARGET_FIELDS}
        provenance: Dict[str, FieldProvenance] = {}
        field_confidences: List[float] = []

        # Check each target field
        for field in self.TARGET_FIELDS:
            val = getattr(request, field)
            # The ingest contract defines both null and zero as absent activity
            # when Model A is invoked.  All valid activity estimates are
            # positive, so treating zero this way cannot overwrite a reported
            # non-zero value.
            if val is None or val == 0:
                est_val, method_name, conf, sample_size = self._estimate_field(
                    field=field,
                    request=request,
                    peers=clean_peers,
                )
                filled_fields.append(field)
                filled_values[field] = est_val
                field_confidences.append(conf)

                provenance[field] = FieldProvenance(
                    field_name=field,
                    original_value=None,
                    estimated_value=est_val,
                    was_modeled=True,
                    method=method_name,
                    confidence=conf,
                    peer_sample_size=sample_size,
                )
            else:
                # Value was provided by user
                provenance[field] = FieldProvenance(
                    field_name=field,
                    original_value=float(val),
                    estimated_value=float(val),
                    was_modeled=False,
                    method="provided",
                    confidence=1.0,
                    peer_sample_size=0,
                )

        # Determine overall confidence
        if field_confidences:
            overall_confidence = round(sum(field_confidences) / len(field_confidences), 2)
        else:
            overall_confidence = 1.0

        # Determine data_source
        if not filled_fields:
            data_source = request.data_source
        elif request.data_source == DataSource.MODELED:
            # A second fill pass must not incorrectly relabel a wholly-modelled
            # record as mixed merely because it has some already-filled values.
            data_source = DataSource.MODELED
        elif len(filled_fields) == len(self.TARGET_FIELDS):
            data_source = DataSource.MODELED
        else:
            data_source = DataSource.MIXED

        return GapFillResponse(
            supplier_id=request.supplier_id,
            filled_fields=filled_fields,
            energy_kwh=filled_values["energy_kwh"],
            material_quantity_kg=filled_values["material_quantity_kg"],
            transport_distance_km=filled_values["transport_distance_km"],
            production_volume=filled_values["production_volume"],
            data_source=data_source,
            confidence=overall_confidence,
            provenance=provenance,
        )

    def _estimate_field(
        self,
        field: str,
        request: GapFillRequest,
        peers: Sequence[SupplierActivityInput],
    ) -> Tuple[float, str, float, int]:
        """Estimate a specific field with hierarchical fallback and ratio scaling."""
        req_mat = request.material_code.value if isinstance(request.material_code, MaterialCode) else str(request.material_code)
        req_tier = int(request.tier.value if isinstance(request.tier, Tier) else request.tier)

        # Filter tiers
        peers_exact = [
            p for p in peers
            if (p.material_code.value if hasattr(p.material_code, "value") else str(p.material_code)) == req_mat
            and int(p.tier.value if hasattr(p.tier, "value") else p.tier) == req_tier
            and self._positive_finite(getattr(p, field, 0))
        ]
        peers_mat = [
            p for p in peers
            if (p.material_code.value if hasattr(p.material_code, "value") else str(p.material_code)) == req_mat
            and self._positive_finite(getattr(p, field, 0))
        ]
        peers_tier = [
            p for p in peers
            if int(p.tier.value if hasattr(p.tier, "value") else p.tier) == req_tier
            and self._positive_finite(getattr(p, field, 0))
        ]
        peers_global = [p for p in peers if self._positive_finite(getattr(p, field, 0))]

        # Select match level
        if peers_exact:
            selected_peers = peers_exact
            level = "peer_exact"
        elif peers_mat:
            selected_peers = peers_mat
            level = "peer_material_fallback"
        elif peers_tier:
            selected_peers = peers_tier
            level = "peer_tier_fallback"
        elif peers_global:
            selected_peers = peers_global
            level = "global_corpus_fallback"
        else:
            # Emergency fallback if no peer data at all
            val = DEFAULT_ACTIVITY_VALUES.get(field, 100.0)
            return val, "default_benchmark", 0.05, 0

        sample_size = len(selected_peers)
        values = [float(getattr(p, field)) for p in selected_peers]
        base_conf = self._confidence(level, values)

        # Contextual ratio scaling where meaningful
        if field == "energy_kwh" and request.production_volume and request.production_volume > 0:
            intensities = [
                p.energy_kwh / p.production_volume
                for p in selected_peers
                if self._positive_finite(p.production_volume)
            ]
            if intensities:
                ratio = statistics.median(intensities)
                est_val = round(request.production_volume * ratio, 2)
                conf = min(1.0, round(base_conf * 1.1, 2))
                return est_val, f"{level}_intensity_scaled", conf, sample_size

        if field == "material_quantity_kg" and request.production_volume and request.production_volume > 0:
            ratios = [
                p.material_quantity_kg / p.production_volume
                for p in selected_peers
                if self._positive_finite(p.production_volume)
            ]
            if ratios:
                ratio = statistics.median(ratios)
                est_val = round(request.production_volume * ratio, 2)
                conf = min(1.0, round(base_conf * 1.1, 2))
                return est_val, f"{level}_ratio_scaled", conf, sample_size

        if field == "production_volume" and request.material_quantity_kg and request.material_quantity_kg > 0:
            ratios = [
                p.production_volume / p.material_quantity_kg
                for p in selected_peers
                if self._positive_finite(p.material_quantity_kg)
            ]
            if ratios:
                ratio = statistics.median(ratios)
                est_val = round(request.material_quantity_kg * ratio, 2)
                conf = min(1.0, round(base_conf * 1.1, 2))
                return est_val, f"{level}_ratio_scaled", conf, sample_size

        # Default to median (or mean) of selected peers
        est_val = round(float(statistics.median(values)), 2)
        return est_val, f"{level}_median", base_conf, sample_size

    @staticmethod
    def _confidence(level: str, values: Sequence[float]) -> float:
        """Return calibrated-by-evidence confidence for a peer estimate.

        Confidence is deliberately a property of the evidence rather than a
        label assigned to a method: broader peer matches, small samples, and
        heterogeneous peers all lower it.  The coefficient of variation is
        robustly estimated from median absolute deviation so one anomalous
        supplier cannot make all estimates look unreliable.
        """
        match_weight = {
            "peer_exact": 1.0,
            "peer_material_fallback": 0.8,
            "peer_tier_fallback": 0.6,
            "global_corpus_fallback": 0.4,
        }[level]
        n = len(values)
        support = n / (n + 2.0)
        if n < 2:
            # A singleton peer contains no empirical variance information.
            stability = 0.6
        else:
            median = statistics.median(values)
            mad = statistics.median(abs(value - median) for value in values)
            robust_cv = (1.4826 * mad / median) if median > 0 else 1.0
            stability = 1.0 / (1.0 + robust_cv)
        return round(max(0.05, min(0.99, match_weight * support * stability)), 2)
