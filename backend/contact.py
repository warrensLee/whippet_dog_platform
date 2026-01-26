import os
import smtplib
import time
from email.message import EmailMessage
from typing import Dict, Any
from flask import Blueprint, request, jsonify

contact_bp = Blueprint("contact_bp", __name__)

CONTACT_TO_EMAIL = os.getenv("CONTACT_TO_EMAIL", "##YOUR_CONTACT_EMAIL_HERE##")
FROM_EMAIL = os.getenv("FROM_EMAIL", os.getenv("SMTP_USER", ""))
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
CONTACT_SEND_EMAIL = os.getenv("CONTACT_SEND_EMAIL", "true").lower() in ("1", "true", "yes", "on")

_RATE_LIMIT_WINDOW_SEC = 60
_RATE_LIMIT_MAX_REQ = 10
_ip_hits: Dict[str, list[float]] = {}

def _json_error(message: str, status: int = 400):
    return jsonify({"error": message}), status

def _get_client_ip() -> str:
    xff = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    return xff or request.remote_addr or "unknown"

def _rate_limit(ip: str) -> bool:
    now = time.time()
    hits = _ip_hits.get(ip, [])
    hits = [t for t in hits if now - t < _RATE_LIMIT_WINDOW_SEC]
    if len(hits) >= _RATE_LIMIT_MAX_REQ:
        _ip_hits[ip] = hits
        return False
    hits.append(now)
    _ip_hits[ip] = hits
    return True

def _validate_payload(data: Dict[str, Any]) -> Dict[str, str]:
    first = str(data.get("firstName", "")).strip()
    last = str(data.get("lastName", "")).strip()
    email = str(data.get("email", "")).strip()
    subject = str(data.get("subject", "")).strip()
    message = str(data.get("message", "")).strip()

    if not first or not last or not email or not subject or not message:
        raise ValueError("Please fill out all required fields.")

    if len(first) > 80 or len(last) > 80:
        raise ValueError("Name is too long.")

    if len(subject) > 150:
        raise ValueError("Subject is too long.")

    if len(message) > 5000:
        raise ValueError("Message is too long.")

    return {
        "firstName": first,
        "lastName": last,
        "email": email,
        "subject": subject,
        "message": message,
    }

def _send_email(payload: Dict[str, str]) -> None:
    if not (SMTP_HOST and SMTP_PORT and SMTP_USER and SMTP_PASS and FROM_EMAIL):
        raise RuntimeError("Email is not configured on the server (missing SMTP settings).")

    msg = EmailMessage()
    msg["Subject"] = f"[CWA Contact] {payload['subject']}"
    msg["From"] = FROM_EMAIL
    msg["To"] = CONTACT_TO_EMAIL
    msg["Reply-To"] = payload["email"]

    body = (
        f"New contact submission:\n\n"
        f"Name: {payload['firstName']} {payload['lastName']}\n"
        f"Email: {payload['email']}\n"
        f"Subject: {payload['subject']}\n\n"
        f"Message:\n{payload['message']}\n"
    )
    msg.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)


@contact_bp.route("/api/contact", methods=["POST"])
def submit_contact():
    ip = _get_client_ip()
    if not _rate_limit(ip):
        return _json_error("Too many requests. Please try again in a minute.", 429)

    if not request.is_json:
        return _json_error("Request must be JSON.", 415)

    data = request.get_json(silent=True) or {}
    try:
        payload = _validate_payload(data)
    except ValueError as e:
        return _json_error(str(e), 400)

    if CONTACT_SEND_EMAIL:
        try:
            _send_email(payload)
        except Exception as e:
            return _json_error("Unable to send your message right now. Please try again later.", 500)

    return jsonify({"ok": True}), 200


@contact_bp.route("/api/contact/health", methods=["GET"])
def contact_health():
    return jsonify(
        {
            "ok": True,
            "emailEnabled": CONTACT_SEND_EMAIL,
            "to": CONTACT_TO_EMAIL,
        }
    ), 200