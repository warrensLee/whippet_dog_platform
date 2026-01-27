from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.meet import Meet

meet_bp = Blueprint("meet", __name__, url_prefix="/api/meet")


@meet_bp.post("/register")
def register_meet():
    data = request.get_json(silent=True) or {}
    meet = Meet.from_request_data(data)

    validation_errors = meet.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Meet.exists(meet.meet_number):
        return jsonify({"ok": False, "error": "Meet already exists"}), 409
    try:
        meet.save()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@meet_bp.post("/edit")
def edit_meet():
    data = request.get_json(silent=True) or {}

    meet_number = (data.get("meetNumber") or "").strip()
    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400

    meet = Meet.from_request_data(data)
    meet.meet_number = meet_number
    validation_errors = meet.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not Meet.exists(meet_number):
        return jsonify({"ok": False, "error": "Meet does not exist"}), 404

    try:
        meet.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@meet_bp.post("/delete")
def delete_meet():
    data = request.get_json(silent=True) or {}
    meet_number = (data.get("meetNumber") or "").strip()

    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400

    if not Meet.exists(meet_number):
        return jsonify({"ok": False, "error": "Meet does not exist"}), 404

    try:
        meet = Meet.find_by_identifier(meet_number)
        if not meet:
            return jsonify({"ok": False, "error": "Meet does not exist"}), 404
        meet.delete(meet_number)
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@meet_bp.get("/get/<meet_number>")
def get_meet(meet_number: str):
    meet = Meet.find_by_identifier(meet_number)
    if not meet:
        return jsonify({"ok": False, "error": "Meet does not exist"}), 404
    return jsonify(meet.to_dict()), 200


@meet_bp.get("/list")
def list_all_meets():
    try:
        meets = Meet.list_all_meets()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    meets_data = [meet.to_dict() for meet in meets]
    return jsonify(meets_data), 200           