from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from database import fetch_one
from classes.user_role import UserRole
from classes.change_log import ChangeLog

user_role_bp = Blueprint("user_role", __name__, url_prefix="/api/user_role")
PROTECTED_ROLES = {"ADMIN", "PUBLIC"}

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    return (u.get("PersonID") or u.get("personId") or u.get("id") or None)

@user_role_bp.get("/list")
def list_user_roles():
    roles = UserRole.list_all_user_roles()
    return jsonify({"ok": True, "data": [r.to_dict() for r in roles]}), 200

@user_role_bp.get("/get/<int:role_id>")
def get_user_role(role_id: int):
    role = UserRole.find_by_id(role_id)
    if not role:
        return jsonify({"ok": False, "error": "User role does not exist"}), 404
    return jsonify({"ok": True, "data": role.to_dict()}), 200

@user_role_bp.post("/register")
def register_user_role():
    data = request.get_json(silent=True) or {}
    user_role = UserRole.from_request_data(data)

    editor_id = _current_editor_id()
    if editor_id:
        ok = fetch_one("SELECT 1 FROM Person WHERE PersonID = %s LIMIT 1", (editor_id,))
        if not ok:
            editor_id = None
    user_role.last_edited_by = editor_id

    errors = user_role.validate()
    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    if UserRole.exists(user_role.title):
        return jsonify({"ok": False, "error": "User role already exists"}), 409

    user_role.save()

    ChangeLog.log(
        changed_table="UserRole",
        record_pk=user_role.title,
        operation="INSERT",
        changed_by=editor_id,
        source="api/user_role/register POST",
        before_obj=None,
        after_obj=user_role.to_dict(),
    )

    saved = UserRole.find_by_title(user_role.title)
    return jsonify({"ok": True, "data": saved.to_dict() if saved else user_role.to_dict()}), 201

@user_role_bp.post("/edit")
def edit_user_role():
    data = request.get_json(silent=True) or {}
    role_id = data.get("roleId", data.get("id"))
    if role_id is None:
        return jsonify({"ok": False, "error": "roleId is required"}), 400

    try:
        role_id = int(role_id)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "roleId must be an integer"}), 400

    role_before = UserRole.find_by_id(role_id)
    if not role_before:
        return jsonify({"ok": False, "error": "User role does not exist"}), 404

    title = (role_before.title or "").strip().upper()
    if title in PROTECTED_ROLES:
        return jsonify({"ok": False, "error": f'Cannot edit protected role "{title}"'}), 403

    user_role = UserRole.from_request_data({**data, "title": title, "id": role_id})

    editor_id = _current_editor_id()
    if editor_id:
        ok = fetch_one("SELECT 1 FROM Person WHERE PersonID = %s LIMIT 1", (editor_id,))
        if not ok:
            editor_id = None
    user_role.last_edited_by = editor_id

    errors = user_role.validate()
    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    user_role.update_by_id()
    role_after = UserRole.find_by_id(role_id)

    ChangeLog.log(
        changed_table="UserRole",
        record_pk=str(role_id),
        operation="UPDATE",
        changed_by=editor_id,
        source="api/user_role/edit POST",
        before_obj=role_before.to_dict(),
        after_obj=role_after.to_dict() if role_after else user_role.to_dict(),
    )

    return jsonify({"ok": True, "data": role_after.to_dict() if role_after else user_role.to_dict()}), 200
