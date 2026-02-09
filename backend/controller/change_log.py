from flask import Blueprint, jsonify
from mysql.connector import Error
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from utils.auth_helpers import current_editor_id, current_role, require_scope

change_log_bp = Blueprint("change_log", __name__, url_prefix="/api/change_log")


@change_log_bp.get("/get/<int:id>")
def get_change_log(id):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_change_log_scope, "view change logs")
    if deny:
        return deny

    change_log = ChangeLog.find_by_identifier(id)
    if not change_log:
        return jsonify({"ok": False, "error": "Change log does not exist"}), 404

    if role.view_change_log_scope == UserRole.SELF:
        pid = current_editor_id()
        if not pid:
            return jsonify({"ok": False, "error": "Not signed in"}), 401
        if change_log.changed_by != pid:
            return jsonify({"ok": False, "error": "Not allowed to view this change log"}), 403

    return jsonify({"ok": True, "data": change_log.to_dict()}), 200


@change_log_bp.get("/get")
def list_all_change_logs():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_change_log_scope, "view change logs")
    if deny:
        return deny

    try:
        if role.view_change_log_scope == UserRole.ALL:
            change_logs = ChangeLog.list_all()

        elif role.view_change_log_scope == UserRole.SELF:
            pid = current_editor_id()
            if not pid:
                return jsonify({"ok": False, "error": "Not signed in"}), 401
            change_logs = ChangeLog.list_for_user(pid)

        else:
            return jsonify({"ok": False, "error": "Not allowed to view change logs"}), 403

        return jsonify({"ok": True, "data": [c.to_dict() for c in change_logs]}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500