import os
import base64
import resend

def send_reset_email(to_email, token):
    resend.api_key = os.getenv("RESEND_API_KEY")

    base_url = os.getenv("SITE_URL", "http://localhost")
    reset_url = f"{base_url}/reset-password?token={token}"

    resend.Emails.send({
        "from": os.getenv("FROM_EMAIL"),
        "to": to_email,
        "subject": "Reset your password",
        "html": f"""
            <p>You requested a password reset.</p>
            <p><a href="{reset_url}">Reset your password</a></p>
            <p>If you did not request this, you can ignore this email.</p>
        """
    })

def send_invite_email(to_email, token):
    resend.api_key = os.getenv("RESEND_API_KEY")
    base_url = os.getenv("SITE_URL", "http://localhost")
    register_url = f"{base_url}/register?token={token}"

    resend.Emails.send({
        "from": os.getenv("FROM_EMAIL"),
        "to": to_email,
        "subject": "You have been invited to register",
        "html": f"""
            <p>You have been invited to create an account.</p>
            <p><a href="{register_url}">Complete your registration</a></p>
            <p>This link will expire soon.</p>
        """
    })

def send_titles_email(to_email, pdf_bytes, filename="titles.pdf"):
    resend.api_key = os.getenv("RESEND_API_KEY")

    resend.Emails.send({
        "from": os.getenv("FROM_EMAIL"),
        "to": to_email,
        "subject": "Dog Title Report",
        "html": """
            <p>Your dog title report is attached.</p>
            <p>Please see the attached PDF for full details.</p>
        """,
        "attachments": [
            {
                "filename": filename,
                "content": base64.b64encode(pdf_bytes).decode("utf-8")
            }
        ]
    })