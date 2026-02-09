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

def _is_own_role(target_role: UserRole) -> bool:
    """
    For VIEW_SELF behavior: only allow viewing the role that equals your SystemRole.
    """
    u = session.get("user") or {}
    my_title = (u.get("SystemRole") or "").strip().upper()
    return bool(target_role and (target_role.title or "").strip().upper() == my_title)


@user_role_bp.get("/get")
def list_user_roles():
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    print("DEBUG SystemRole:", (session.get("user") or {}).get("SystemRole"))
    print("DEBUG role.title:", getattr(role, "title", None))
    print("DEBUG role.__dict__:", getattr(role, "__dict__", {}))
    print("DEBUG view_user_role_scope:", getattr(role, "view_user_role_scope", None))
    print("DEBUG edit_user_role_scope:", getattr(role, "edit_user_role_scope", None))
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_user_role_scope, "view user roles")
    if deny:
        return deny

    if role.view_user_role_scope != UserRole.ALL:
        return jsonify({"ok": False, "error": "Not allowed to list all user roles"}), 403

    roles = UserRole.list_all_user_roles()
    return jsonify({"ok": True, "data": [r.to_dict() for r in roles]}), 200


@user_role_bp.get("/get/<int:role_id>")
def get_user_role(role_id: int):
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_user_role_scope, "view user roles")
    if deny:
        return deny

    target = UserRole.find_by_id(role_id)
    if not target:
        return jsonify({"ok": False, "error": "User role does not exist"}), 404

    if role.view_user_role_scope == UserRole.SELF and not _is_own_role(target):
        return jsonify({"ok": False, "error": "Not allowed to view this user role"}), 403

    return jsonify({"ok": True, "data": target.to_dict()}), 200


@user_role_bp.post("/add")
def register_user_role():
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_user_role_scope, "create user roles")
    if deny:
        return deny

    if role.edit_user_role_scope != UserRole.ALL:
        return jsonify({"ok": False, "error": "Not allowed to create user roles"}), 403

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
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_user_role_scope, "edit user roles")
    if deny:
        return deny

    if role.edit_user_role_scope != UserRole.ALL:
        return jsonify({"ok": False, "error": "Not allowed to edit user roles"}), 403

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

@user_role_bp.post("/delete")
def delete_user_role():
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_user_role_scope, "delete user roles")
    if deny:
        return deny

    # Deleting roles requires ALL
    if role.edit_user_role_scope != UserRole.ALL:
        return jsonify({"ok": False, "error": "Not allowed to delete user roles"}), 403

    data = request.get_json(silent=True) or {}
    role_id = data.get("roleId")

    if role_id is None:
        return jsonify({"ok": False, "error": "roleId is required"}), 400

    try:
        role_id = int(role_id)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "roleId must be an integer"}), 400

    target = UserRole.find_by_id(role_id)
    if not target:
        return jsonify({"ok": False, "error": "User role does not exist"}), 404

    title = (target.title or "").strip().upper()
    if title in PROTECTED_ROLES:
        return jsonify({"ok": False, "error": f'Cannot delete protected role "{title}"'}), 403

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400

    before_snapshot = target.to_dict()
    editor_id = _current_editor_id()

    try:
        target.delete_by_id()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    ChangeLog.log(
        changed_table="UserRole",
        record_pk=str(role_id),
        operation="DELETE",
        changed_by=editor_id,
        source="api/user_role/delete POST",
        before_obj=before_snapshot,
        after_obj=None,
    )

    return jsonify({"ok": True}), 200

