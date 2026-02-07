from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from database import fetch_one
from datetime import datetime, timezone
from classes.officer_role import OfficerRole
from classes.change_log import ChangeLog
from classes.user_role import UserRole

officer_role_bp = Blueprint("officer_role", __name__, url_prefix="/api/officer_role")


def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    pid = u.get("PersonID")
    return pid if pid else None


def _current_role() -> UserRole | None:
    u = session.get("user") or {}
    pid = u.get("PersonID")
    if not pid:
        return None

    title = u.get("SystemRole")
    if not title:
        return None

    return UserRole.find_by_title(title.strip().upper())


def _require_scope(scope_value: int, action: str):
    if scope_value == UserRole.NONE:
        return jsonify({"ok": False, "error": f"Not allowed to {action}"}), 403
    return None


def _is_owner(person_id: str) -> bool:
    pid = _current_editor_id()
    if not pid:
        return False
    return pid == person_id


@officer_role_bp.post("/add")
def register_officer_role():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_officer_role_scope, "create officer roles")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    officer = OfficerRole.from_request_data(data)

    officer.last_edited_by = _current_editor_id()
    officer.last_edited_at = datetime.now(timezone.utc)

    errors = officer.validate()
    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    if OfficerRole.exists_by_name(officer.role_name):
        return jsonify({"ok": False, "error": "Officer role already exists"}), 409

    if role.edit_officer_role_scope == UserRole.SELF and not _is_owner(officer.person_id):
        return jsonify({"ok": False, "error": "Not allowed to create officer roles for this person"}), 403

    try:
        officer.save()

        # best-effort: get the inserted row for logging/response consistency
        inserted = fetch_one(
            "SELECT ID FROM OfficerRole WHERE RoleName=%s LIMIT 1",
            (officer.role_name,),
        )
        if inserted:
            officer.role_id = int(inserted.get("ID"))

        ChangeLog.log(
            changed_table="OfficerRole",
            record_pk=str(officer.role_id) if officer.role_id else officer.role_name,
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/officer_role/register POST",
            before_obj=None,
            after_obj=officer.to_dict(),
        )

        return jsonify({"ok": True, "data": officer.to_dict()}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@officer_role_bp.post("/edit")
def edit_officer_role():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_officer_role_scope, "edit officer roles")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    officer = OfficerRole.from_request_data(data)

    if not officer.role_name:
        return jsonify({"ok": False, "error": "RoleName is required"}), 400

    existing = OfficerRole.find_by_role_name(officer.role_name)
    if not existing:
        return jsonify({"ok": False, "error": "Officer role does not exist"}), 404

    original_person_id = existing.person_id

    if role.edit_officer_role_scope == UserRole.SELF and not _is_owner(original_person_id):
        return jsonify({"ok": False, "error": "Not allowed to edit this officer role"}), 403

    before_snapshot = existing.to_dict()

    existing.person_id = officer.person_id
    existing.display_order = officer.display_order
    existing.active = officer.active
    existing.last_edited_by = _current_editor_id()
    existing.last_edited_at = datetime.now(timezone.utc)

    errors = existing.validate()
    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    try:
        existing.update()

        refreshed = OfficerRole.find_by_role_name(existing.role_name)
        after_snapshot = refreshed.to_dict() if refreshed else None

        ChangeLog.log(
            changed_table="OfficerRole",
            record_pk=existing.role_name, 
            operation="UPDATE",
            changed_by=_current_editor_id(),
            source="api/officer_role/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        return jsonify({"ok": True, "data": after_snapshot}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500



@officer_role_bp.post("/delete")
def delete_officer_role():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_officer_role_scope, "delete officer roles")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400

    role_name = (data.get("roleName") or "").strip()
    if not role_name:
        return jsonify({"ok": False, "error": "RoleName is required"}), 400

    try:
        existing = OfficerRole.find_by_role_name(role_name)
        if not existing:
            return jsonify({"ok": False, "error": "Officer role does not exist"}), 404

        if role.edit_officer_role_scope == UserRole.SELF and not _is_owner(existing.person_id):
            return jsonify({"ok": False, "error": "Not allowed to delete this officer role"}), 403

        before_snapshot = existing.to_dict()

        OfficerRole.delete_by_role_name(role_name)

        ChangeLog.log(
            changed_table="OfficerRole",
            record_pk=role_name,
            operation="DELETE",
            changed_by=_current_editor_id(),
            source="api/officer_role/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500



@officer_role_bp.get("/get/<role_name>")
def get_officer_role(role_name):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_officer_role_scope, "view officer roles")
    if deny:
        return deny

    role_name = (role_name or "").strip()
    if not role_name:
        return jsonify({"ok": False, "error": "RoleName is required"}), 400

    officer = OfficerRole.find_by_role_name(role_name)
    if not officer:
        return jsonify({"ok": False, "error": "Officer role does not exist"}), 404

    if role.view_officer_role_scope == UserRole.SELF and not _is_owner(officer.person_id):
        return jsonify({"ok": False, "error": "Not allowed to view this officer role"}), 403

    return jsonify({"ok": True, "data": officer.to_dict()}), 200



@officer_role_bp.get("/get")
def list_officer_roles():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_officer_role_scope, "view officer roles")
    if deny:
        return deny

    try:
        if role.view_officer_role_scope == UserRole.ALL:
            officers = OfficerRole.list_all()
        else:
            pid = _current_editor_id()
            if not pid:
                return jsonify({"ok": False, "error": "Not signed in"}), 401
            officers = OfficerRole.list_for_person(pid)

        return jsonify({"ok": True, "data": [o.to_dict() for o in officers]}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    
@officer_role_bp.get("/public/get")
def list_officer_roles_public():
    try:
        officers = OfficerRole.list_all()
        return jsonify({"ok": True, "data": [o.to_dict() for o in officers]}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@officer_role_bp.get("/mine")
def list_my_officer_roles():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_officer_role_scope, "view officer roles")
    if deny:
        return deny

    pid = _current_editor_id()
    if not pid:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    try:
        officers = OfficerRole.list_for_person(pid)
        return jsonify({"ok": True, "data": [o.to_dict() for o in officers]}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
