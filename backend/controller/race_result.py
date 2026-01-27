from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.race_result import RaceResult

race_result_bp = Blueprint("race_result", __name__, url_prefix="/api/race_result")


@race_result_bp.post("/register")
def register_race_result():
    data = request.get_json(silent=True) or {}
    race_result = RaceResult.from_request_data(data)

    validation_errors = RaceResult.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if RaceResult.exists(race_result.meet_number, race_result.cwa_number, race_result.program, race_result.race_number):
        return jsonify({"ok": False, "error": "Race result already exists"}), 409

    try:
        race_result.save()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@race_result_bp.post("/edit")
def edit_change_log():
    data = request.get_json(silent=True) or {}

    meet_number = (data.get("meetNumber") or "").strip()
    cwa_number = (data.get("cwaNumber") or "").strip()
    program = (data.get("program") or "").strip()
    race_number = (data.get("raceNumber") or "").strip()
    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA number is required"}), 400
    if not program:
        return jsonify({"ok": False, "error": "Program is required"}), 400
    if not race_number:
        return jsonify({"ok": False, "error": "Race number is required"}), 400

    race_result = RaceResult.from_request_data(data)
    race_result.meet_number = meet_number
    race_result.cwa_number = cwa_number
    race_result.program = program
    race_result.race_number = race_number
    validation_errors = race_result.validate()

    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not RaceResult.exists(race_result.meet_number, race_result.cwa_number, race_result.program, race_result.race_number):
        return jsonify({"ok": False, "error": "Race result does not exist"}), 404

    try:
        race_result.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@race_result_bp.post("/delete")
def delete_race_result():
    data = request.get_json(silent=True) or {}
    meet_number = (data.get("meetNumber") or "").strip()
    cwa_number = (data.get("cwaNumber") or "").strip()
    program = (data.get("program") or "").strip()
    race_number = (data.get("raceNumber") or "").strip()

    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA number is required"}), 400
    if not program:
        return jsonify({"ok": False, "error": "Program is required"}), 400
    if not race_number:
        return jsonify({"ok": False, "error": "Race number is required"}), 400

    if not RaceResult.exists(meet_number, cwa_number, program, race_number):
        return jsonify({"ok": False, "error": "Race result does not exist"}), 404

    try:
        race_result = RaceResult.find_by_identifier(meet_number, cwa_number, program, race_number)
        if not race_result:
            return jsonify({"ok": False, "error": "Race result does not exist"}), 404
        race_result.delete(race_result.meet_number, race_result.cwa_number, race_result.program, race_result.race_number)
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@race_result_bp.get("/get/<meet_number>/<cwa_number>/<program>/<race_number>")
def get_race_result(meet_number: str, cwa_number: str, program: str, race_number: str):
    race_result = RaceResult.find_by_identifier(meet_number, cwa_number, program, race_number)
    if not race_result:
        return jsonify({"ok": False, "error": "Race result does not exist"}), 404

    return jsonify(race_result.to_dict()), 200


@race_result_bp.get("/list")
def list_all_race_results():
    try:
        race_results = RaceResult.list_all_race_results()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    race_results_data = [race_result.to_dict() for race_result in race_results]
    return jsonify(race_results_data), 200           