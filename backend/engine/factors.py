"""Emission factor registry, lookup, and fallback resolution.

Per docs/CARBON_ENGINE.md:
"If a factor is missing, use other / grid_mixed / road fallbacks and set
data_source to mixed if it was primary."
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from .constants import (
    FALLBACK_ELECTRICITY_SOURCE,
    FALLBACK_MATERIAL_CODE,
    FALLBACK_TRANSPORT_MODE,
    FactorCategory,
    LOGISTICS_ROAD_FACTOR_CODE,
)
from .models import EmissionFactor


class FactorLookupResult:
    """Result of a factor lookup indicating value, factor details, and fallback status."""

    def __init__(
        self,
        factor: EmissionFactor,
        is_fallback: bool = False,
        fallback_note: Optional[str] = None,
    ):
        self.factor = factor
        self.is_fallback = is_fallback
        self.fallback_note = fallback_note

    @property
    def value(self) -> float:
        return self.factor.factor_kg_co2e_per_unit

    @property
    def code(self) -> str:
        return self.factor.code

    @property
    def unit(self) -> str:
        return self.factor.unit


class FactorRegistry:
    """Registry holding emission factors with org override and fallback capabilities."""

    def __init__(self, factors: Optional[List[EmissionFactor]] = None):
        # Key: (org_id, factor_category, code)
        self._factors: Dict[Tuple[Optional[str], str, str], EmissionFactor] = {}
        if factors:
            for factor in factors:
                self.register(factor)

    def register(self, factor: EmissionFactor) -> None:
        """Register or update an emission factor."""
        cat_val = factor.factor_category.value if isinstance(factor.factor_category, FactorCategory) else str(factor.factor_category)
        key = (factor.org_id, cat_val, factor.code)
        self._factors[key] = factor

    def get(
        self,
        category: FactorCategory,
        code: str,
        org_id: Optional[str] = None,
    ) -> Optional[EmissionFactor]:
        """Look up factor with org preference, then global (org_id=None)."""
        cat_val = category.value if isinstance(category, FactorCategory) else str(category)
        # 1. Org-specific override
        if org_id is not None:
            key_org = (org_id, cat_val, code)
            if key_org in self._factors:
                return self._factors[key_org]
        # 2. Global default
        key_global = (None, cat_val, code)
        if key_global in self._factors:
            return self._factors[key_global]
        return None

    def get_with_fallback(
        self,
        category: FactorCategory,
        code: str,
        org_id: Optional[str] = None,
    ) -> FactorLookupResult:
        """Look up factor by category and code. Apply documented fallbacks if not found."""
        direct = self.get(category, code, org_id)
        if direct is not None:
            return FactorLookupResult(factor=direct, is_fallback=False)

        # Apply fallback per docs/CARBON_ENGINE.md
        cat_val = category.value if isinstance(category, FactorCategory) else str(category)
        fallback_code: Optional[str] = None

        if cat_val == FactorCategory.MATERIAL.value:
            fallback_code = FALLBACK_MATERIAL_CODE
        elif cat_val == FactorCategory.ENERGY.value:
            fallback_code = FALLBACK_ELECTRICITY_SOURCE
        elif cat_val == FactorCategory.TRANSPORT.value:
            fallback_code = FALLBACK_TRANSPORT_MODE
        elif cat_val == FactorCategory.MANUFACTURING.value:
            fallback_code = "mfg_other"
        elif cat_val == FactorCategory.LOGISTICS.value:
            fallback_code = LOGISTICS_ROAD_FACTOR_CODE

        if fallback_code and fallback_code != code:
            fallback_factor = self.get(category, fallback_code, org_id)
            if fallback_factor is not None:
                note = f"Factor '{code}' missing in category '{cat_val}', fell back to '{fallback_code}'."
                return FactorLookupResult(factor=fallback_factor, is_fallback=True, fallback_note=note)

        # If even fallback is missing in registry, create a safe fallback
        safe_fallback = EmissionFactor(
            factor_id=f"fac_fallback_{cat_val}_{code}",
            org_id=None,
            factor_category=category,
            code=code,
            factor_kg_co2e_per_unit=1.0,
            unit="unit",
            source="emergency_fallback",
            year=2024,
        )
        return FactorLookupResult(
            factor=safe_fallback,
            is_fallback=True,
            fallback_note=f"Emergency default factor used for category {cat_val}, code {code}.",
        )

    @classmethod
    def from_fixture(cls, fixture_path: Optional[Path] = None) -> "FactorRegistry":
        """Load standard emission factors from fixtures/factors.json."""
        if fixture_path is None:
            # Look relative to repository root
            candidates = [
                Path("fixtures/factors.json"),
                Path(__file__).parent.parent.parent / "fixtures" / "factors.json",
            ]
            for p in candidates:
                if p.is_file():
                    fixture_path = p
                    break

        if not fixture_path or not fixture_path.is_file():
            raise FileNotFoundError("fixtures/factors.json not found.")

        with open(fixture_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        factors = [EmissionFactor(**item) for item in data["items"]]
        return cls(factors=factors)


# Singleton instance loaded from default fixture
_default_registry: Optional[FactorRegistry] = None


def get_default_registry() -> FactorRegistry:
    """Get or initialize the default global factor registry."""
    global _default_registry
    if _default_registry is None:
        _default_registry = FactorRegistry.from_fixture()
    return _default_registry

