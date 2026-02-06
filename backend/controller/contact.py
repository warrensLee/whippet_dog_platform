from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from typing import Dict, Any
from functools import wraps
from collections import defaultdict
from datetime import datetime, timedelta

contact_bp = Blueprint("contact", __name__, url_prefix="/api/contact")

class RateLimiter:
    """Simple in-memory rate limiter for API endpoints."""
    
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests = defaultdict(list)
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if a request from the given identifier is allowed."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.window_seconds)
        
        self._requests[identifier] = [
            ts for ts in self._requests[identifier] 
            if ts > cutoff
        ]
        
        if len(self._requests[identifier]) >= self.max_requests:
            return False
        
        self._requests[identifier].append(now)
        return True
    
    def cleanup_old_entries(self):
        """Periodically clean up old IP addresses (call from a background task)."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.window_seconds * 2)
        
        to_delete = [
            ip for ip, timestamps in self._requests.items()
            if not timestamps or all(ts < cutoff for ts in timestamps)
        ]
        
        for ip in to_delete:
            del self._requests[ip]


contact_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)


def get_client_ip() -> str:
    # Check X-Forwarded-For header first (for proxies/load balancers)
    xff = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    return xff or request.remote_addr or "unknown"


def rate_limit_required(limiter: RateLimiter):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = get_client_ip()
            
            if not limiter.is_allowed(client_ip):
                return jsonify({
                    "error": "Too many requests. Please try again in a minute."
                }), 429
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def json_error(message: str, status: int = 400):
    """Return a consistent JSON error response."""
    return jsonify({"error": message}), status


def validate_contact_payload(data: Dict[str, Any]) -> Dict[str, str]:
    """Validate and sanitize contact form data."""
    first = str(data.get("firstName", "")).strip()
    last = str(data.get("lastName", "")).strip()
    email = str(data.get("email", "")).strip()
    subject = str(data.get("subject", "")).strip()
    message = str(data.get("message", "")).strip()

    if not all([first, last, email, subject, message]):
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


def send_contact_email(payload: Dict[str, str]) -> None:
    """Send contact form submission via email."""
    from main import mail

    required_configs = [
        "MAIL_SERVER",
        "MAIL_USERNAME",
        "MAIL_PASSWORD",
        "MAIL_DEFAULT_SENDER",
        "CONTACT_TO_EMAIL"
    ]
    
    if not all(current_app.config.get(key) for key in required_configs):
        raise RuntimeError(
            "Email is not configured on the server (missing SMTP settings)."
        )

    msg = Message(
        subject=f"[CWA Contact] {payload['subject']}",
        sender=current_app.config["MAIL_DEFAULT_SENDER"],
        recipients=[current_app.config["CONTACT_TO_EMAIL"]],
        reply_to=payload["email"],
    )

    msg.body = (
        f"New contact submission:\n\n"
        f"Name: {payload['firstName']} {payload['lastName']}\n"
        f"Email: {payload['email']}\n"
        f"Subject: {payload['subject']}\n\n"
        f"Message:\n{payload['message']}\n"
    )

    mail.send(msg)


@contact_bp.post("")
@rate_limit_required(contact_rate_limiter)
def submit_contact():
    """Handle contact form submissions."""
    if not request.is_json:
        return json_error("Request must be JSON.", 415)

    data = request.get_json(silent=True) or {}
    try:
        payload = validate_contact_payload(data)
    except ValueError as e:
        return json_error(str(e), 400)

    try:
        send_contact_email(payload)
    except Exception as e:
        current_app.logger.error(f"Failed to send contact email: {e}")
        return json_error(
            "Unable to send your message right now. Please try again later.", 
            500
        )

    return jsonify({"ok": True}), 200