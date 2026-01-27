from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.meet_result import MeetResult

meet_result_bp = Blueprint("meet_result", __name__, url_prefix="/api/meet_result")


@meet_result_bp.post("/register")
def register_meet_result():
    data = request.get_json(silent=True) or {}
    meet_result = MeetResult.from_request_data(data)

    validation_errors = meet_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if MeetResult.exists(meet_result.meet_number, meet_result.cwa_number):
        return jsonify({"ok": False, "error": "Meet result already exists"}), 409
    try:
        meet_result.save()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@meet_result_bp.post("/edit")
def edit_meet_result():
    data = request.get_json(silent=True) or {}

    meet_number = (data.get("meetNumber") or "").strip()
    cwa_number = (data.get("cwaNumber") or "").strip()
    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400

    meet_result = MeetResult.from_request_data(data)
    meet_result.meet_number = meet_number

    validation_errors = meet_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not MeetResult.exists(meet_result.meet_number):
        return jsonify({"ok": False, "error": "Meet result does not exist"}), 404

    try:
        meet_result.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@meet_result_bp.post("/delete")
def delete_meet_result():
    data = request.get_json(silent=True) or {}
    meet_number = (data.get("meetNumber") or "").strip()
    cwa_number = (data.get("cwaNumber") or "").strip()

    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400      

    if not MeetResult.exists(meet_number):
        return jsonify({"ok": False, "error": "Meet result does not exist"}), 404

    try:
        meet_result = MeetResult.find_by_identifier(meet_number)
        if not meet_result:
            return jsonify({"ok": False, "error": "Meet result does not exist"}), 404
        meet_result.delete(meet_number, cwa_number)
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@meet_result_bp.get("/get/<meet_number>/<cwa_number>")
def get_meet_result(meet_number: str, cwa_number: str):
    meet_result = MeetResult.find_by_identifier(meet_number, cwa_number)
    if not meet_result:
        return jsonify({"ok": False, "error": "Meet result does not exist"}), 404
    return jsonify(meet_result.to_dict()), 200


@meet_result_bp.get("/list")
def list_all_meet_results():
    try:
        meet_results = MeetResult.list_all_meet_results()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    meet_results_data = [meet_result.to_dict() for meet_result in meet_results]
    return jsonify(meet_results_data), 200  