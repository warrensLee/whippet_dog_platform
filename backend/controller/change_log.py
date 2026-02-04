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
    try:
        change_log.save()
        return jsonify({"ok": True}), 201
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@change_log_bp.post("/edit")
def edit_change_log():
    data = request.get_json(silent=True) or {}
    id_value = data.get("id", None)
    if id_value in (None, ""):
        return jsonify({"ok": False, "error": "id is required"}), 400

    try:
        id_value = int(id_value)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "id must be an integer"}), 400

    if not ChangeLog.exists(id_value):
        return jsonify({"ok": False, "error": "Change log does not exist"}), 404

    change_log = ChangeLog.from_request_data(data)
    change_log.id = id_value

    validation_errors = change_log.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        change_log.update()
        return jsonify({"ok": True}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@change_log_bp.post("/delete")
def delete_change_log():
    data = request.get_json(silent=True) or {}
    id_value = data.get("id", None)

    if id_value in (None, ""):
        return jsonify({"ok": False, "error": "id is required"}), 400

    try:
        id_value = int(id_value)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "id must be an integer"}), 400

    if not ChangeLog.exists(id_value):
        return jsonify({"ok": False, "error": "Change log does not exist"}), 404

    try:
        ChangeLog.delete_by_id(id_value)
        return jsonify({"ok": True}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@change_log_bp.get("/get/<int:id>")
def get_change_log(id: int):
    change_log = ChangeLog.find_by_id(id)
    if not change_log:
        return jsonify({"ok": False, "error": "Change log does not exist"}), 404
    return jsonify({"ok": True, "data": change_log.to_dict()}), 200


@change_log_bp.get("/list")
def list_all_change_logs():
    try:
        change_logs = ChangeLog.list_all()
        return jsonify({"ok": True, "data": [c.to_dict() for c in change_logs]}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
