"""SMTP delivery for security emails.

Credentials are read only from environment variables; never commit them to the
repository or return them through the API.
"""

from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path


def load_local_env() -> None:
    """Load backend/.env when present, without overriding deployed variables."""
    env_file = Path(__file__).resolve().parents[1] / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), value)


def send_password_reset_email(recipient: str, reset_url: str) -> None:
    load_local_env()
    host = os.getenv("SMTP_HOST")
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    # Gmail signs messages for the authenticated account. Sending with a
    # different address in the From header can fail DMARC/DKIM checks at the
    # recipient, so the authenticated mailbox is always the sender address.
    sender = formataddr((os.getenv("SMTP_SENDER_NAME", "Carbonix"), username))
    port = int(os.getenv("SMTP_PORT", "587"))
    if not all((host, username, password)):
        raise RuntimeError("SMTP is not configured")

    message = EmailMessage()
    message["Subject"] = "Reset your Carbonix password"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        "We received a request to reset your Carbonix password.\n\n"
        f"Reset your password: {reset_url}\n\n"
        "This link expires in 30 minutes and can be used once. If you did not request it, you can ignore this email."
    )
    with smtplib.SMTP(host, port, timeout=15) as client:
        client.ehlo()
        client.starttls()
        client.ehlo()
        client.login(username, password)
        client.send_message(message)
