from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from datetime import datetime, timezone
from classes.person import Person
from classes.change_log import ChangeLog
from classes.user_role import UserRole

person_bp = Blueprint("person", __name__, url_prefix="/api/person")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    return u.get("PersonID") or None


def _current_role() -> UserRole | None:
    u = session.get("user") or {}
    pid = u.get("PersonID")
    if not pid:
        return None

    title = u.get("SystemRole")
    if not title:
        return None

    return UserRole.find_by_title(title.strip().upper())


def _require_login():
    if not _current_editor_id():
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    return None


def _require_scope(scope_value: int, action: str):
    if int(scope_value or 0) == UserRole.NONE:
        return jsonify({"ok": False, "error": f"Not allowed to {action}"}), 403
    return None


def _is_owner(person_id: str) -> bool:
    current_id = _current_editor_id()
    if not current_id:
        return False
    return str(current_id) == str(person_id)


@person_bp.post("/add")
def register_person():
    # must be logged in
    login_err = _require_login()
    if login_err:
        return login_err

    # must have role
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    # must have edit_person_scope
    deny = _require_scope(role.edit_person_scope, "create people")
    if deny:
        return deny

    # creating a person requires ALL (SELF is not enough)
    if role.edit_person_scope != UserRole.ALL:
        return jsonify({"ok": False, "error": "Not allowed to create people"}), 403

    data = request.get_json(silent=True) or {}
    person = Person.from_request_data(data)

    password = (data.get("password") or "").strip()
    if not password:
        return jsonify({"ok": False, "error": "Password is required"}), 400

    person.set_password(password)

    # default role if not provided
    if not person.system_role:
        person.system_role = "Public"

    # audit fields
    editor_id = _current_editor_id()
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
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_person_scope, "edit people")
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

    person.last_edited_by = _current_editor_id()
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
            changed_by=_current_editor_id(),
            source="api/person/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
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

    current_id = _current_editor_id()

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
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_person_scope, "view people")
    if deny:
        return deny

    # SELF => only your own
    if role.view_person_scope == UserRole.SELF and not _is_owner(person_id):
        return jsonify({"ok": False, "error": "Forbidden"}), 403

    person = Person.find_by_identifier(person_id)
    if not person:
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    return jsonify({"ok": True, "data": person.to_dict()}), 200


@person_bp.get("/get")
def list_all_persons():
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_person_scope, "view people")
    if deny:
        return deny

    # Listing everyone is effectively "ALL"
    if role.view_person_scope != UserRole.ALL:
        return jsonify({"ok": False, "error": "Not allowed to list all people"}), 403

    try:
        persons = Person.list_all_persons()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    persons_data = [p.to_dict() for p in persons]
    return jsonify({"ok": True, "data": persons_data}), 200
