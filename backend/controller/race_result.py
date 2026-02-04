from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from classes.race_result import RaceResult
from classes.change_log import ChangeLog
from datetime import datetime

race_result_bp = Blueprint("race_result", __name__, url_prefix="/api/race_result")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    return (u.get("PersonID") or u.get("personId") or u.get("id") or None)

@race_result_bp.post("/register")
def register_race_result():
    data = request.get_json(silent=True) or {}
    race_result = RaceResult.from_request_data(data)

    race_result.last_edited_by = _current_editor_id()
    race_result.last_edited_at = datetime.utcnow()

    validation_errors = race_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if RaceResult.exists(race_result.meet_number, race_result.cwa_number, race_result.program, race_result.race_number):
        return jsonify({"ok": False, "error": "Race result already exists"}), 409

    try:
        race_result.save()
        ChangeLog.log(
            changed_table="RaceResult",
            record_pk=f"{race_result.meet_number}|{race_result.cwa_number}|{race_result.program}|{race_result.race_number}",
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/race_result/register POST",
            before_obj=None,
            after_obj=race_result.to_dict(),
        )
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

    existing = RaceResult.find_by_identifier(meet_number, cwa_number, program, race_number)
    if not existing:
        return jsonify({"ok": False, "error": "Race result does not exist"}), 404
    
    before_snapshot = existing.to_dict()
    race_result = RaceResult.from_request_data(data)
    race_result.meet_number = meet_number
    race_result.cwa_number = cwa_number
    race_result.program = program
    race_result.race_number = race_number

    race_result.last_edited_by = _current_editor_id()
    race_result.last_edited_at = datetime.utcnow()
    
    validation_errors = race_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        race_result.update()
        refreshed = RaceResult.find_by_identifier(meet_number, cwa_number, program, race_number)
        after_snapshot = refreshed.to_dict() if refreshed else race_result.to_dict()
        
        ChangeLog.log(
            changed_table="RaceResult",
            record_pk=f"{meet_number}|{cwa_number}|{program}|{race_number}",
            operation="UPDATE",
            changed_by=_current_editor_id(),
            source="api/race_result/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
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

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA number is required"}), 400
    if not program:
        return jsonify({"ok": False, "error": "Program is required"}), 400
    if not race_number:
        return jsonify({"ok": False, "error": "Race number is required"}), 400

    try:
        race_result = RaceResult.find_by_identifier(meet_number, cwa_number, program, race_number)
        if not race_result:
            return jsonify({"ok": False, "error": "Race result does not exist"}), 404
        
        before_snapshot = race_result.to_dict()
        race_result.delete(race_result.meet_number, race_result.cwa_number, race_result.program, race_result.race_number)
        
        ChangeLog.log(
            changed_table="RaceResult",
            record_pk=f"{meet_number}|{cwa_number}|{program}|{race_number}",
            operation="DELETE",
            changed_by=_current_editor_id(),
            source="api/race_result/delete POST",
            before_obj=before_snapshot,
        )

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
