from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.user_role import UserRole
from classes.change_log import ChangeLog
from utils.auth_helpers import current_editor_id, current_role, require_scope

user_role_bp = Blueprint("user_role", __name__, url_prefix="/api/user_role")

PROTECTED_ROLES = {"ADMIN", "PUBLIC"}


def _is_own_role(my_role, target_role):
    return (
        (my_role and target_role)
        and (target_role.title or "").strip().upper()
        == (my_role.title or "").strip().upper()
    )


@user_role_bp.get("/get")
def list_user_roles():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_user_role_scope, "view user roles")
    if deny:
        return deny

    if role.view_user_role_scope == UserRole.ALL:
        roles = UserRole.list_all_user_roles()
        return jsonify({"ok": True, "data": [r.to_dict() for r in roles]}), 200

    if role.view_user_role_scope == UserRole.SELF:
        return jsonify({"ok": True, "data": [role.to_dict()]}), 200

    return jsonify({"ok": False, "error": "Not allowed"}), 403

@user_role_bp.get("/get/<int:role_id>")
def get_user_role(role_id):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_user_role_scope, "view user roles")
    if deny:
        return deny

    target = UserRole.find_by_id(role_id)
    if not target:
        return jsonify({"ok": False, "error": "User role does not exist"}), 404

    if role.view_user_role_scope == UserRole.SELF and not _is_own_role(role, target):
        return jsonify({"ok": False, "error": "Not allowed to view this user role"}), 403

    return jsonify({"ok": True, "data": target.to_dict()}), 200


@user_role_bp.post("/add")
def register_user_role():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_user_role_scope, "create user roles")
    if deny:
        return deny

    if role.edit_user_role_scope == UserRole.NONE:
        return jsonify({"ok": False, "error": "Not allowed to create user roles"}), 403

    data = request.get_json(silent=True) or {}
    user_role = UserRole.from_request_data(data)

    title = (user_role.title or "").strip().upper()
    if title in PROTECTED_ROLES:
        return jsonify({"ok": False, "error": f'Cannot create protected role "{title}"'}), 403

    if role.edit_user_role_scope == UserRole.SELF:
        if hasattr(user_role, "matches_scopes"):
            allowed = user_role.matches_scopes(role)
        else:
            user_role.copy_scopes_from(role)
            allowed = True

        if not allowed:
            return jsonify(
                {
                    "ok": False,
                    "error": "Not allowed to create a role with different permissions.",
                }
            ), 403

    user_role.last_edited_by = current_editor_id()
    errors = user_role.validate()

    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    if UserRole.exists(user_role.title):
        return jsonify({"ok": False, "error": "User role already exists"}), 409

    try:
        user_role.save()

        ChangeLog.log(
            changed_table="UserRole",
            record_pk=user_role.title,
            operation="INSERT",
            changed_by=current_editor_id(),
            source="api/user_role/register POST",
            before_obj=None,
            after_obj=user_role.to_dict(),
        )

        saved = UserRole.find_by_title(user_role.title)
        return jsonify({"ok": True, "data": saved.to_dict() if saved else user_role.to_dict()}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@user_role_bp.post("/edit")
def edit_user_role():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_user_role_scope, "edit user roles")
    if deny:
        return deny

    if role.edit_user_role_scope == UserRole.NONE:
        return jsonify({"ok": False, "error": "Not allowed to edit user roles"}), 403

    data = request.get_json(silent=True) or {}
    role_id = data.get("roleId") or data.get("id")
    if role_id is None:
        return jsonify({"ok": False, "error": "roleId is required"}), 400

    role_before = UserRole.find_by_id(role_id)
    if not role_before:
        return jsonify({"ok": False, "error": "User role does not exist"}), 404

    title = (role_before.title or "").strip().upper()
    if title in PROTECTED_ROLES:
        return jsonify({"ok": False, "error": f'Cannot edit protected role "{title}"'}), 403

    if role.edit_user_role_scope == UserRole.SELF and not role_before.matches_scopes(role):
        return jsonify({
            "ok": False,
            "error": "Not allowed to edit roles with different permissions."
        }), 403

    user_role = UserRole.from_request_data({**data, "title": title, "id": role_id})

    user_role.last_edited_by = current_editor_id()

    errors = user_role.validate()
    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    try:
        user_role.update_by_id()
        role_after = UserRole.find_by_id(role_id)

        ChangeLog.log(
            changed_table="UserRole",
            record_pk=user_role.title,
            operation="UPDATE",
            changed_by=current_editor_id(),
            source="api/user_role/edit POST",
            before_obj=role_before.to_dict(),
            after_obj=role_after.to_dict() if role_after else user_role.to_dict(),
        )

        return jsonify({"ok": True, "data": role_after.to_dict()}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@user_role_bp.post("/delete")
def delete_user_role():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_user_role_scope, "delete user roles")
    if deny:
        return deny

    if role.edit_user_role_scope  == UserRole.NONE:
        return jsonify({"ok": False, "error": "Not allowed to delete user roles"}), 403

    data = request.get_json(silent=True) or {}
    role_id = data.get("roleId") or data.get("id")
    if role_id is None:
        return jsonify({"ok": False, "error": "roleId is required"}), 400

    target = UserRole.find_by_id(role_id)
    if not target:
        return jsonify({"ok": False, "error": "User role does not exist"}), 404

    title = (target.title or "").strip().upper()
    if title in PROTECTED_ROLES:
        return jsonify({"ok": False, "error": f'Cannot delete protected role "{title}"'}), 403

    if role.edit_user_role_scope == UserRole.SELF and not target.matches_scopes(role):
        return jsonify(
            {
                "ok": False,
                "error": "Not allowed to delete roles with different permissions.",
            }
        ), 403

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400

    before_snapshot = target.to_dict()

    try:
        target.delete_by_id()

        ChangeLog.log(
            changed_table="UserRole",
            record_pk=target.id,
            operation="DELETE",
            changed_by=current_editor_id(),
            source="api/user_role/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
