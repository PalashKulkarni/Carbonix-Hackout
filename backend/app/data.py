from __future__ import annotations

import json
from pathlib import Path
from typing import Any

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures"


def load_fixture(name: str) -> dict[str, Any]:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def suppliers() -> list[dict[str, Any]]:
    return load_fixture("suppliers.json")["items"]


def supplier_by_id(supplier_id: str) -> dict[str, Any] | None:
    return next((item for item in suppliers() if item["supplier_id"] == supplier_id), None)
