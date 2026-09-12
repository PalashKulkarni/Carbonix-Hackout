"""Grounded answers over the current organization's carbon inventory.

This module deliberately does not generate official emissions values.  It reads
already-calculated engine results and recommendation records, then formats an
answer from those records only.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import EmissionResult, Recommendation, Supplier


GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")


@dataclass(frozen=True)
class ChatIntent:
    kind: str
    normalized_question: str


def _is_greeting(question: str) -> bool:
    normalized = question.casefold().strip(" .,!?")
    greetings = {
        "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
        "how are you", "namaste", "नमस्ते", "नमस्कार", "hola", "bonjour", "ciao",
        "hallo", "olá", "مرحبا", "السلام عليكم", "你好", "こんにちは", "안녕하세요",
    }
    return normalized in greetings


def _looks_out_of_scope(question: str) -> bool:
    normalized = question.casefold()
    unrelated_terms = ("recipe", "pasta", "weather", "poem", "joke", "movie", "song", "sports score")
    return any(term in normalized for term in unrelated_terms)


def _tonnes(value_kg: float) -> str:
    return f"{value_kg / 1000:,.2f} tCO2e"


def _supplier_records(database: Session, org_id: str, period: str) -> list[dict[str, Any]]:
    rows = database.execute(
        select(Supplier, EmissionResult)
        .join(EmissionResult, EmissionResult.supplier_id == Supplier.supplier_id)
        .where(Supplier.org_id == org_id, EmissionResult.period == period)
        .order_by(EmissionResult.total_co2e_kg.desc())
    ).all()
    return [
        {
            "supplier_id": supplier.supplier_id,
            "name": supplier.name,
            "tier": supplier.tier,
            "material_code": supplier.material_code,
            "carbon_risk": result.carbon_risk,
            "rank": result.rank,
            "total_co2e_kg": float(result.total_co2e_kg),
            "intensity_kg_per_unit": float(result.intensity_kg_per_unit),
            "energy_co2e_kg": float(result.energy_co2e_kg),
            "transport_co2e_kg": float(result.transport_co2e_kg),
            "material_co2e_kg": float(result.material_co2e_kg),
            "manufacturing_co2e_kg": float(result.manufacturing_co2e_kg),
            "logistics_co2e_kg": float(result.logistics_co2e_kg),
        }
        for supplier, result in rows
    ]


def answer_inventory_question(database: Session, org_id: str, question: str, period: str) -> str:
    """Return a response grounded solely in this org's persisted records."""
    suppliers = _supplier_records(database, org_id, period)
    if not suppliers:
        return f"There is no calculated supplier inventory for {period} yet. Add or upload suppliers, then recalculate emissions."

    query = question.casefold()
    total = sum(supplier["total_co2e_kg"] for supplier in suppliers)
    matched_supplier = next(
        (supplier for supplier in suppliers if supplier["name"].casefold() in query),
        None,
    )

    if matched_supplier:
        buckets = {
            "energy": matched_supplier["energy_co2e_kg"],
            "transport": matched_supplier["transport_co2e_kg"],
            "material": matched_supplier["material_co2e_kg"],
            "manufacturing": matched_supplier["manufacturing_co2e_kg"],
            "logistics": matched_supplier["logistics_co2e_kg"],
        }
        largest_bucket, largest_value = max(buckets.items(), key=lambda item: item[1])
        recommendations = database.scalars(
            select(Recommendation)
            .where(Recommendation.org_id == org_id, Recommendation.supplier_id == matched_supplier["supplier_id"])
            .order_by(Recommendation.delta_co2e_kg.desc())
            .limit(1)
        ).all()
        organization_share = matched_supplier["total_co2e_kg"] / total * 100 if total else 0
        risk_reason = (
            f"It represents {organization_share:.1f}% of the organization total, meeting the 15% high-risk threshold."
            if organization_share >= 15
            else f"Its intensity is {matched_supplier['intensity_kg_per_unit']:,.2f} kg CO2e per unit."
        )
        answer = (
            f"{matched_supplier['name']} is ranked #{matched_supplier['rank']} in {period} with "
            f"{_tonnes(matched_supplier['total_co2e_kg'])} ({matched_supplier['carbon_risk']} risk). "
            f"Its largest source is {largest_bucket} at {_tonnes(largest_value)}, and its intensity is "
            f"{matched_supplier['intensity_kg_per_unit']:,.2f} kg CO2e per unit. {risk_reason}"
        )
        if recommendations:
            recommendation = recommendations[0]
            answer += f" Top recorded action: {recommendation.title} - potential reduction {_tonnes(float(recommendation.delta_co2e_kg))}."
        return answer

    if any(term in query for term in ("recommend", "roi", "reduction", "action", "decarbon")):
        recommendations = database.scalars(
            select(Recommendation)
            .where(Recommendation.org_id == org_id)
            .order_by(Recommendation.delta_co2e_kg.desc())
            .limit(3)
        ).all()
        if not recommendations:
            return f"No current recommendations are available for {period}."
        items = "; ".join(
            f"{recommendation.title} ({_tonnes(float(recommendation.delta_co2e_kg))})"
            for recommendation in recommendations
        )
        return f"The largest engine-calculated reduction opportunities for {period} are: {items}."

    if "logistics" in query:
        logistics_total = sum(supplier["logistics_co2e_kg"] for supplier in suppliers)
        return (
            f"Logistics contributes {_tonnes(logistics_total)} in {period}, "
            f"which is {(logistics_total / total * 100) if total else 0:.2f}% of the current supplier inventory. "
            "It is calculated from each supplier's material mass, the 50 km last-mile assumption, and the logistics-road factor."
        )

    if any(term in query for term in ("intensity", "efficient", "inefficient")):
        highest_intensity = max(suppliers, key=lambda supplier: supplier["intensity_kg_per_unit"])
        return (
            f"{highest_intensity['name']} has the highest current carbon intensity: "
            f"{highest_intensity['intensity_kg_per_unit']:,.2f} kg CO2e per unit "
            f"({_tonnes(highest_intensity['total_co2e_kg'])} total emissions)."
        )

    if any(term in query for term in ("hotspot", "highest", "top supplier", "largest emitter", "risk")):
        top = suppliers[:3]
        summary = "; ".join(
            f"#{supplier['rank']} {supplier['name']} ({_tonnes(supplier['total_co2e_kg'])}, {supplier['carbon_risk']} risk)"
            for supplier in top
        )
        return f"The current {period} carbon hotspots are {summary}."

    if any(term in query for term in ("total", "footprint", "inventory", "emission")):
        return (
            f"The current {period} supplier inventory is {_tonnes(total)} across {len(suppliers)} suppliers. "
            f"The largest contributor is {suppliers[0]['name']} at {_tonnes(suppliers[0]['total_co2e_kg'])}."
        )

    return (
        "I can answer questions using the current supplier inventory only. Try asking about total emissions, "
        "hotspots, supplier intensity, logistics, recommendations, or a supplier by name."
    )


def _request_groq(messages: list[dict[str, str]], max_completion_tokens: int = 220) -> str | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    payload = json.dumps({
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.1,
        "max_completion_tokens": max_completion_tokens,
        "response_format": {"type": "json_object"},
    }).encode()
    request = Request(
        GROQ_CHAT_URL,
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=12) as response:
            return json.loads(response.read().decode())["choices"][0]["message"]["content"].strip() or None
    except (HTTPError, URLError, TimeoutError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError):
        return None


def _interpret_question(question: str) -> ChatIntent:
    """Translate/classify a question before it reaches the deterministic data layer."""
    if _is_greeting(question):
        return ChatIntent("greeting", question)
    if _looks_out_of_scope(question):
        return ChatIntent("out_of_scope", question)
    response = _request_groq([
        {"role": "system", "content": (
            "Classify the user message for a Carbonix supply-chain emissions assistant. "
            "Return JSON only: {\"kind\": \"inventory\"|\"greeting\"|\"out_of_scope\", "
            "\"normalized_question\": \"concise English retrieval question\"}. "
            "Inventory includes suppliers, emissions, hotspots, carbon risk, intensity, logistics, factors, "
            "recommendations, and scenarios. Translate any language to English. Greetings and small talk are greeting. "
            "Anything unrelated to Carbonix inventory is out_of_scope."
        )},
        {"role": "user", "content": question},
    ], max_completion_tokens=100)
    if response:
        try:
            parsed = json.loads(response)
            kind = parsed.get("kind")
            normalized_question = str(parsed.get("normalized_question") or question)
            if kind in {"inventory", "greeting", "out_of_scope"}:
                return ChatIntent(kind, normalized_question)
        except (TypeError, ValueError, json.JSONDecodeError):
            pass
    return ChatIntent("inventory", question)


def _respond_with_groq(question: str, factual_answer: str, intent: str) -> str | None:
    """Use Groq for multilingual phrasing, never as the source of inventory facts."""
    prompt = (
        "Return JSON only: {\"reply\": \"...\"}. Reply in the same language as the user. "
        "Keep it concise and helpful. "
        "For inventory: use ONLY the supplied authoritative answer; do not add, alter, infer, or omit figures. "
        "For greeting: greet warmly and briefly say you can help with Carbonix suppliers, emissions, hotspots, "
        "recommendations, logistics, and scenarios. For out_of_scope: politely say you only assist with Carbonix "
        "supply-chain carbon data, and name the supported topics.\n\n"
        f"Intent: {intent}\n"
        f"User question: {question}\n\n"
        f"Authoritative inventory answer: {factual_answer}"
    )
    response = _request_groq([
        {"role": "system", "content": "Never invent or change Carbonix inventory data."},
        {"role": "user", "content": prompt},
    ])
    if response:
        try:
            return str(json.loads(response).get("reply") or "").strip() or None
        except (TypeError, ValueError, json.JSONDecodeError):
            return None
    return None


def answer_chat_question(database: Session, org_id: str, question: str, period: str) -> str:
    """Respond conversationally while preserving a deterministic data boundary."""
    intent = _interpret_question(question)
    if intent.kind == "greeting":
        fallback = "Hello! I am the Carbonix assistant. I can help with suppliers, emissions, hotspots, recommendations, logistics, and scenarios."
    elif intent.kind == "out_of_scope":
        fallback = "I am focused on Carbonix supply-chain carbon data. Ask me about suppliers, emissions, hotspots, carbon risk, logistics, recommendations, factors, or scenarios."
    else:
        fallback = answer_inventory_question(database, org_id, intent.normalized_question, period)
    polished_answer = _respond_with_groq(question, fallback, intent.kind)
    if polished_answer is None:
        return fallback
    if intent.kind != "inventory":
        return polished_answer
    return f"{polished_answer}\n\nVerified inventory data: {fallback}"
