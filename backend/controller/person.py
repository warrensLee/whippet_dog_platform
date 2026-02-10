from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from datetime import datetime, timezone
from classes.person import Person
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from utils.auth_helpers import current_editor_id, current_role, require_scope

person_bp = Blueprint("person", __name__, url_prefix="/api/person")

def _is_owner(person_id: str) -> bool:
    current_id = _current_editor_id()
    if not current_id:
        return False
    return str(current_id) == str(person_id)


@person_bp.post("/add")
def register_person():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_person_scope, "create people")
    if deny:
        return deny

    if role.edit_person_scope != UserRole.ALL:
        return jsonify({"ok": False, "error": "Not allowed to create people"}), 403

    data = request.get_json(silent=True) or {}
    person = Person.from_request_data(data)

    password = (data.get("password") or "").strip()
    if not password:
        return jsonify({"ok": False, "error": "Password is required"}), 400

    person.set_password(password)

    if not person.system_role:
        person.system_role = "PUBLIC"

    editor_id = current_editor_id()
    person.last_edited_by = editor_id
    person.last_edited_at = datetime.now(timezone.utc)

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
            changed_by=editor_id,
            source="api/person/add POST",
            before_obj=None,
            after_obj=person.to_dict(),
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@person_bp.post("/edit")
def edit_person():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_person_scope, "edit people")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    person_id = (data.get("personId") or "").strip()
    if not person_id:
        return jsonify({"ok": False, "error": "Person ID is required"}), 400

    if role.edit_person_scope == UserRole.SELF and not _is_owner(person_id):
        return jsonify({"ok": False, "error": "You can only edit your own profile"}), 403

    existing = Person.find_by_identifier(person_id)
    if not existing:
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    before_snapshot = existing.to_dict()

    person = Person.from_request_data(data)
    person.person_id = person_id

    person.password_hash = existing.password_hash

    if role.edit_person_scope != UserRole.ALL:
        person.system_role = existing.system_role

    person.last_edited_by = current_editor_id()
    person.last_edited_at = datetime.now(timezone.utc)

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
            changed_by=current_editor_id(),
            source="api/person/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200



@person_bp.post("/change-password")
def change_password():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    data = request.get_json(silent=True) or {}
    current_password = (data.get("currentPassword") or "").strip()
    new_password = (data.get("newPassword") or "").strip()

    if not current_password or not new_password:
        return jsonify({"ok": False, "error": "Current and new password are required"}), 400
    if len(new_password) < 6:
        return jsonify({"ok": False, "error": "New password must be at least 6 characters"}), 400

    current_id = current_editor_id()

    try:
        person = Person.find_by_identifier(current_id)
        if not person:
            return jsonify({"ok": False, "error": "User not found"}), 404

        before_snapshot = person.to_dict()

        if not person.check_password(current_password):
            return jsonify({"ok": False, "error": "Current password is incorrect"}), 400

        person.set_password(new_password)
        person.last_edited_by = current_id
        person.last_edited_at = datetime.now(timezone.utc)
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
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_person_scope, "view people")
    if deny:
        return deny

    if role.view_person_scope == UserRole.SELF and not _is_owner(person_id):
        return jsonify({"ok": False, "error": "Forbidden"}), 403

    person = Person.find_by_identifier(person_id)
    if not person:
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    return jsonify({"ok": True, "data": person.to_dict()}), 200


@person_bp.get("/get")
def list_all_persons():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_person_scope, "view people")
    if deny:
        return deny

    if role.view_person_scope != UserRole.ALL:
        return jsonify({"ok": False, "error": "Not allowed to list all people"}), 403

    try:
        persons = Person.list_all_persons()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    persons_data = [p.to_dict() for p in persons]
    return jsonify({"ok": True, "data": persons_data}), 200
