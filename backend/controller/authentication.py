from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from classes.person import Person
from classes.change_log import ChangeLog
from datetime import datetime, timezone

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    password = data.get("password") or ""
    person = Person.from_request_data(data)
    
    if not password:
        return jsonify({"ok": False, "error": "Password is required"}), 400
    
    if not person.system_role:
        person.system_role = "Public"
    
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
        
        # Log the registration
        ChangeLog.log(
            changed_table="Person",
            record_pk=person.person_id,
            operation="INSERT",
            changed_by=person.person_id,
            source="api/auth/register POST",
            before_obj=None,
            after_obj=person.to_dict(),
        )
        
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    
    return jsonify({"ok": True}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("username") or "").strip()
    password = data.get("password") or ""
    
    if not identifier or not password:
        return jsonify({"ok": False, "error": "Missing username or password"}), 400
    
    person = Person.find_by_identifier(identifier)
    if not person:
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401
    
    if not person.check_password(password):
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401
     
    session["user"] = person.to_session_dict()
    
    return jsonify({"ok": True, "user": session["user"]}), 200


@auth_bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"ok": True}), 200


@auth_bp.get("/me")
def me():
    u = session.get("user")
    if not u or not u.get("PersonID"):
        return jsonify({"ok": True, "user": None}), 200
    
    person = Person.find_by_identifier(u["PersonID"])
    if not person:
        session.clear()
        return jsonify({"ok": True, "user": None}), 200
    
    session["user"] = person.to_session_dict()
    return jsonify({"ok": True, "user": session["user"]}), 200