from flask import Blueprint, jsonify, session
from mysql.connector import Error
from classes.change_log import ChangeLog
from classes.user_role import UserRole

change_log_bp = Blueprint("change_log", __name__, url_prefix="/api/change_log")

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

def _require_scope(scope_value: int, action: str):
    if scope_value == UserRole.NONE:
        return jsonify({"ok": False, "error": f"Not allowed to {action}"}), 403
    return None

@change_log_bp.get("/get/<int:id>")
def get_change_log(id: int):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_change_log_scope, "view change logs")
    if deny:
        return deny

    change_log = ChangeLog.find_by_identifier(id)
    if not change_log:
        return jsonify({"ok": False, "error": "Change log does not exist"}), 404

    # SELF means: only logs you created (ChangedBy == your PersonID)
    if role.view_change_log_scope == UserRole.SELF and change_log.changed_by != _current_editor_id():
        return jsonify({"ok": False, "error": "Not allowed to view this change log"}), 403

    return jsonify({"ok": True, "data": change_log.to_dict()}), 200

@change_log_bp.get("/get")
def list_all_change_logs():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_change_log_scope, "view change logs")
    if deny:
        return deny

    try:
        if role.view_change_log_scope == UserRole.ALL:
            change_logs = ChangeLog.list_all()
        else:
            pid = _current_editor_id()
            change_logs = ChangeLog.list_for_user(pid)

        return jsonify({"ok": True, "data": [c.to_dict() for c in change_logs]}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500