from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
import time
from database import fetch_all
from typing import Dict, Any

contact_bp = Blueprint("contact_bp", __name__)

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
    from main import mail 
    
    if not (current_app.config.get('MAIL_SERVER') and 
            current_app.config.get('MAIL_USERNAME') and 
            current_app.config.get('MAIL_PASSWORD') and 
            current_app.config.get('MAIL_DEFAULT_SENDER')):
        raise RuntimeError("Email is not configured on the server (missing SMTP settings).")

    msg = Message(
        subject=f"[CWA Contact] {payload['subject']}",
        sender=current_app.config['MAIL_DEFAULT_SENDER'],
        recipients=[current_app.config['CONTACT_TO_EMAIL']],
        reply_to=payload['email']
    )
    
    body = (
        f"New contact submission:\n\n"
        f"Name: {payload['firstName']} {payload['lastName']}\n"
        f"Email: {payload['email']}\n"
        f"Subject: {payload['subject']}\n\n"
        f"Message:\n{payload['message']}\n"
    )
    msg.body = body
    
    mail.send(msg)


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

    try:
        _send_email(payload)
    except Exception as e:
        print(f"Email error: {e}")
        return _json_error("Unable to send your message right now. Please try again later.", 500)

    return jsonify({"ok": True}), 200

@contact_bp.get("/api/contact/officers")
def club_officers():
    rows = fetch_all("""
        SELECT
            o.RoleName AS role,
            CONCAT(p.FirstName, ' ', p.LastName) AS name,
            p.EmailAddress AS email,
            o.DisplayOrder AS display_order
        FROM OfficerRole o
        JOIN Person p ON p.PersonID = o.PersonID
        WHERE o.Active = TRUE
        ORDER BY o.DisplayOrder ASC, o.RoleName ASC, p.LastName ASC, p.FirstName ASC
    """)

    officers = [
        {
            "role": r["role"],
            "name": (r.get("name") or "").strip(),
            "email": r.get("email") or None,
        }
        for r in rows
    ]

    return jsonify(officers)


@contact_bp.route("/api/contact/health", methods=["GET"])
def contact_health():
    return jsonify(
        {
            "ok": True,
            "to": current_app.config.get('CONTACT_TO_EMAIL', ''),
        }
    ), 200