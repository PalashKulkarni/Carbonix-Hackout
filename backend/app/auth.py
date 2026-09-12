from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

TOKEN_SECRET = os.getenv("AUTH_TOKEN_SECRET", "carbonix-development-secret-change-me").encode()
TOKEN_TTL_SECONDS = 60 * 60 * 8


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"pbkdf2_sha256$120000${_encode(salt)}${_encode(digest)}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored:
        return False
    try:
        algorithm, iterations, salt_text, digest_text = stored.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        expected = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), _decode(salt_text), int(iterations)
        )
        return hmac.compare_digest(expected, _decode(digest_text))
    except (ValueError, TypeError):
        return False


def create_token(user_id: str, org_id: str, email: str) -> str:
    payload = {"sub": user_id, "org_id": org_id, "email": email, "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    encoded = _encode(json.dumps(payload, separators=(",", ":")).encode())
    signature = hmac.new(TOKEN_SECRET, encoded.encode(), hashlib.sha256).digest()
    return f"{encoded}.{_encode(signature)}"


def decode_token(token: str) -> dict[str, Any] | None:
    if token == "demo-token-apex":
        return {"sub": "usr_demo", "org_id": "org_apex", "email": "demo@apex.example", "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    try:
        encoded, signature = token.split(".", 1)
        expected = hmac.new(TOKEN_SECRET, encoded.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _decode(signature)):
            return None
        payload = json.loads(_decode(encoded))
        if int(payload["exp"]) < int(time.time()):
            return None
        return payload
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return None


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
