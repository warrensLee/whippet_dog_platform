from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from classes.person import Person
from classes.change_log import ChangeLog
from datetime import datetime

person_bp = Blueprint("person", __name__, url_prefix="/api/person")

def _current_user_id() -> str | None:
    user = session.get("user")
    return user.get("PersonID") if user else None


def _current_user_role() -> str | None:
    user = session.get("user")
    return user.get("SystemRole") if user else None


def _require_login():
    if not _current_user_id():
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    return None


def _require_admin():
    role = (_current_user_role() or "").strip().upper()
    if role != "ADMIN":
        return jsonify({"ok": False, "error": "Admin access required"}), 403
    return None


@person_bp.post("/register")
def register_person():
    data = request.get_json(silent=True) or {}
    person = Person.from_request_data(data)

    password = (data.get("password") or "").strip()
    if not password:
        return jsonify({"ok": False, "error": "Password is required"}), 400

    person.set_password(password)

    if not person.system_role:
        person.system_role = "Public"  
    person.last_edited_by = person.person_id
    person.last_edited_at = datetime.utcnow()

    validation_errors = person.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Person.exists(person.person_id):
        return jsonify({"ok": False, "error": "Person already exists"}), 409

    try:
        person.save()
        ChangeLog.log(
            changed_table="Person",
            record_pk=person.person_id,
            operation="INSERT",
            changed_by=person.person_id,
            source="api/person/register POST",
            before_obj=None,
            after_obj=person.to_dict(),
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@person_bp.post("/edit")
def edit_person():
    login_err = _require_login()
    if login_err:
        return login_err

    data = request.get_json(silent=True) or {}
    person_id = (data.get("personId") or "").strip()
    if not person_id:
        return jsonify({"ok": False, "error": "Person ID is required"}), 400

    current_id = _current_user_id()
    is_admin = ((_current_user_role() or "").strip().upper() == "ADMIN")
    if not is_admin and person_id != current_id:
        return jsonify({"ok": False, "error": "You can only edit your own profile"}), 403

    existing = Person.find_by_identifier(person_id)
    if not existing:
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    before_snapshot = existing.to_dict()
    person = Person.from_request_data(data)
    person.person_id = person_id

    person.password_hash = existing.password_hash
    
    if not is_admin:
        person.system_role = existing.system_role

    person.last_edited_by = current_id
    person.last_edited_at = datetime.utcnow()

    validation_errors = person.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        person.update()
        refreshed = Person.find_by_identifier(person_id)
        after_snapshot = refreshed.to_dict() if refreshed else person.to_dict()

        ChangeLog.log(
            changed_table="Person",
            record_pk=person_id,
            operation="UPDATE",
            changed_by=current_id,
            source="api/person/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@person_bp.post("/delete-self")
def delete_self():
    login_err = _require_login()
    if login_err:
        return login_err

    current_id = _current_user_id()
    data = request.get_json(silent=True) or {}

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400

    try:
        person = Person.find_by_identifier(current_id)
        if not person:
            return jsonify({"ok": False, "error": "Person does not exist"}), 404

        before_snapshot = person.to_dict()
        person.delete(current_id)
        ChangeLog.log(
            changed_table="Person",
            record_pk=current_id,
            operation="DELETE",
            changed_by=current_id,
            source="api/person/delete-self POST",
            before_obj=before_snapshot,
            after_obj=None,
        )
        
        session.clear()

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200

@person_bp.post("/change-password")
def change_password():
    login_err = _require_login()
    if login_err:
        return login_err

    data = request.get_json(silent=True) or {}
    current_password = (data.get("currentPassword") or "").strip()
    new_password = (data.get("newPassword") or "").strip()

    if not current_password or not new_password:
        return jsonify({"ok": False, "error": "Current and new password are required"}), 400
    if len(new_password) < 6:
        return jsonify({"ok": False, "error": "New password must be at least 6 characters"}), 400

    current_id = _current_user_id()

    try:
        person = Person.find_by_identifier(current_id)
        if not person:
            return jsonify({"ok": False, "error": "User not found"}), 404

        before_snapshot = person.to_dict()

        if not person.check_password(current_password):
            return jsonify({"ok": False, "error": "Current password is incorrect"}), 400

        person.set_password(new_password)
        person.last_edited_by = current_id
        person.last_edited_at = datetime.utcnow()
        person.update()

        refreshed = Person.find_by_identifier(current_id)
        after_snapshot = refreshed.to_dict() if refreshed else person.to_dict()

        ChangeLog.log(
            changed_table="Person",
            record_pk=current_id,
            operation="UPDATE",
            changed_by=current_id,
            source="api/person/change-password POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@person_bp.get("/get/<person_id>")
def get_person(person_id: str):
    login_err = _require_login()
    if login_err:
        return login_err

    current_id = _current_user_id()
    is_admin = ((_current_user_role() or "").strip().upper() == "ADMIN")
    if not is_admin and person_id != current_id:
        return jsonify({"ok": False, "error": "Forbidden"}), 403

    person = Person.find_by_identifier(person_id)
    if not person:
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    return jsonify(person.to_dict()), 200


@person_bp.get("/list")
def list_all_persons():
    login_err = _require_login()
    if login_err:
        return login_err

    admin_err = _require_admin()
    if admin_err:
        return admin_err

    try:
        persons = Person.list_all_persons()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    persons_data = [person.to_dict() for person in persons]
    return jsonify(persons_data), 200