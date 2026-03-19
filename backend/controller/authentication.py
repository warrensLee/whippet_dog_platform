from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
import secrets
from werkzeug.security import check_password_hash, generate_password_hash 
import email_validator
from classes.person import Person
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from datetime import datetime, timedelta, timezone
from classes.password_reset import PasswordResetToken
from classes.registration_invite import RegistrationInvite
from utils.email_service import send_invite_email
from utils.email_service import send_reset_email


DUMMY_HASH = generate_password_hash("dummy_password")
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    password = data.get("password") or ""
    invite_token = (data.get("token") or "").strip()

    if not invite_token:
        return jsonify({"ok": False, "error": "Invite token is required"}), 400

    invite = RegistrationInvite.find_valid(invite_token)
    if not invite:
        return jsonify({"ok": False, "error": "Invalid or expired invite token"}), 400

    person = Person.from_request_data(data)

    if not password:
        return jsonify({"ok": False, "error": "Password is required"}), 400

    if person.email:
        try:
            valid = email_validator.validate_email(
                person.email,
                allow_smtputf8=True,
                check_deliverability=False
            )
            person.email = valid.normalized
        except email_validator.EmailNotValidError as e:
            return jsonify({"ok": False, "error": f"Invalid email address: {str(e)}"}), 400
    else:
        return jsonify({"ok": False, "error": "Email is required"}), 400

    if person.email.lower() != invite.email.lower():
        return jsonify({"ok": False, "error": "Email does not match invite"}), 400

    if not person.system_role:
        person.system_role = "PUBLIC"

    person.last_edited_by = person.person_id
    person.last_edited_at = datetime.now(timezone.utc)

    validation_errors = person.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Person.exists(person.person_id):
        return jsonify({"ok": False, "error": "Username already exists"}), 409

    person.set_password(password)

    try:
        person.save()
        invite.mark_used()
        ChangeLog.log(
            changed_table="Person",
            record_pk=person.person_id,
            operation="INSERT",
            changed_by=person.last_edited_by,
            source="api/auth/register POST",
            before_obj=None,
            after_obj=person.to_dict(),
        )

        return jsonify({"ok": True}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    
@auth_bp.post("/invite")
def invite_user():
    current_user = session.get("user") or {}
    if not current_user.get("PersonID"):
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    role_title = (current_user.get("SystemRole") or "").strip().upper()
    if role_title != "ADMIN":
        return jsonify({"ok": False, "error": "Not authorized"}), 403

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()

    if not email:
        return jsonify({"ok": False, "error": "Email is required"}), 400

    try:
        valid = email_validator.validate_email(
            email,
            allow_smtputf8=True,
            check_deliverability=False
        )
        email = valid.normalized
    except email_validator.EmailNotValidError as e:
        return jsonify({"ok": False, "error": f"Invalid email address: {str(e)}"}), 400

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=2)

    try:
        RegistrationInvite.create(
            email=email,
            token=token,
            expires_at=expires_at,
            created_by=current_user["PersonID"]
        )
        send_invite_email(email, token)

        return jsonify({"ok": True, "message": "Invite sent"}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@auth_bp.post("/login")
def login():
    """Log in with username/email and password."""
    data = request.get_json(silent=True) or {}
    identifier = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"ok": False, "error": "Missing username or password"}), 400

    if "@" in identifier:
        try:
            valid = email_validator.validate_email(
                identifier,
                allow_smtputf8=True,
                check_deliverability=False
            )
            identifier = valid.normalized
        except email_validator.EmailNotValidError:
            pass

    person = Person.find_by_identifier(identifier)
    if not person:
        person = Person.find_by_email(identifier)
    if not person:
        check_password_hash(DUMMY_HASH, password) #This prevents timing based enumeration attacks
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    if not person.check_password(password):
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    session["user"] = person.to_session_dict()
    return jsonify({"ok": True, "user": session["user"]}), 200


@auth_bp.post("/logout")
def logout():
    """Log out the current user."""
    session.clear()
    return jsonify({"ok": True}), 200


@auth_bp.get("/me")
def me():
    """Get current user information."""
    u = session.get("user")
    if not u or not u.get("PersonID"):
        return jsonify({"ok": True, "user": None}), 200

    person = Person.find_by_identifier(u["PersonID"])
    if not person:
        session.clear()
        return jsonify({"ok": True, "user": None}), 200

    session["user"] = person.to_session_dict()
    user = session["user"]

    role_title = (user.get("SystemRole") or "").strip().upper()
    role = UserRole.find_by_title(role_title) if role_title else None
    dog_scope = getattr(role, "edit_dog_scope",
                        UserRole.NONE) if role else UserRole.NONE
    can_manage_dogs = dog_scope == UserRole.ALL
    role_dict = role.to_dict()
    del role_dict["id"]
    del role_dict["lastEditedAt"]
    del role_dict["lastEditedBy"]
    return jsonify({"ok": True, "user": {**user, "role":role_dict}, "signedIn": True, "canManageDogs": can_manage_dogs,  }), 200

@auth_bp.post("/forgot-password")
def forgot_password():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("identifier") or "").strip()

    if not identifier:
        return jsonify({
            "ok": True,
            "message": "If an account exists, a password reset email has been sent."
        }), 200

    person = Person.find_by_identifier(identifier)
    if not person:
        person = Person.find_by_email(identifier)

    if person and person.email:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        PasswordResetToken.create(person.person_id, token, expires_at)
        send_reset_email(person.email, token)

    return jsonify({
        "ok": True,
        "message": "If an account exists, a password reset email has been sent."
    }), 200

@auth_bp.post("/reset-password")
def reset_password():
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    new_password = data.get("password") or ""

    if not token or not new_password:
        return jsonify({"ok": False, "error": "Missing token or password"}), 400

    reset = PasswordResetToken.find_valid(token)
    if not reset:
        return jsonify({"ok": False, "error": "Invalid or expired token"}), 400

    person = Person.find_by_identifier(reset.person_id)
    if not person:
        return jsonify({"ok": False, "error": "User not found"}), 404

    person.set_password(new_password)
    person.last_edited_by = person.person_id
    person.last_edited_at = datetime.now(timezone.utc)
    person.update()
    reset.mark_used() 

    return jsonify({"ok": True, "message": "Password reset successful"}), 200