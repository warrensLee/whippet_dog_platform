from flask import Blueprint, jsonify
from mysql.connector import Error
from classes.change_log import ChangeLog
from utils.auth_helpers import current_role
from utils.error_handler import handle_error

change_log_bp = Blueprint("change_log", __name__, url_prefix="/api/change_log")


@change_log_bp.get("/get/<int:id>")
def get_change_log(id):
    role = current_role()
    if not role or role.title != "ADMIN":
        return jsonify({"ok": False, "error": "Not authorized"}), 403

    change_log = ChangeLog.find_by_identifier(id)
    if not change_log:
        return jsonify({"ok": False, "error": "Change log does not exist"}), 404

    return jsonify({"ok": True, "data": change_log.to_dict()}), 200


@change_log_bp.get("/get")
def list_all_change_logs():
    role = current_role()
    if not role or role.title != "ADMIN":
        return jsonify({"ok": False, "error": "Not authorized"}), 403

    try:
        change_logs = ChangeLog.list_all()
        return jsonify({"ok": True, "data": [c.to_dict() for c in change_logs]}), 200

    except Error as e:
        return handle_error(e, "Database error")