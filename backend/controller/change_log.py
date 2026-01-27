from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.change_log import ChangeLog

change_log_bp = Blueprint("change_log", __name__, url_prefix="/api/change_log")


@change_log_bp.post("/register")
def register_change_log():
    data = request.get_json(silent=True) or {}
    change_log = ChangeLog.from_request_data(data)

    validation_errors = change_log.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if ChangeLog.exists(change_log.log_id):
        return jsonify({"ok": False, "error": "Change log already exists"}), 409

    try:
        change_log.save()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@change_log_bp.post("/edit")
def edit_change_log():
    data = request.get_json(silent=True) or {}

    log_id = (data.get("logId") or "").strip()
    if not log_id:
        return jsonify({"ok": False, "error": "Log ID is required"}), 400

    change_log = ChangeLog.from_request_data(data)
    change_log.log_id = log_id
    validation_errors = change_log.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not ChangeLog.exists(log_id):
        return jsonify({"ok": False, "error": "Change log does not exist"}), 404

    try:
        change_log.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@change_log_bp.post("/delete")
def delete_change_log():
    data = request.get_json(silent=True) or {}
    log_id = (data.get("logId") or "").strip()

    if not log_id:
        return jsonify({"ok": False, "error": "Log ID is required"}), 400

    if not ChangeLog.exists(log_id):
        return jsonify({"ok": False, "error": "Change log does not exist"}), 404

    try:
        change_log = ChangeLog.find_by_identifier(log_id)
        if not change_log:
            return jsonify({"ok": False, "error": "Change log does not exist"}), 404
        change_log.delete(  log_id)
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@change_log_bp.get("/get/<log_id>")
def get_change_log(log_id: str):
    change_log = ChangeLog.find_by_identifier(log_id)
    if not change_log:
        return jsonify({"ok": False, "error": "Change log does not exist"}), 404

    return jsonify(change_log.to_dict()), 200


@change_log_bp.get("/list")
def list_all_change_logs():
    try:
        change_logs = ChangeLog.list_all_change_logs()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    change_logs_data = [change_log.to_dict() for change_log in change_logs]
    return jsonify(change_logs_data), 200           