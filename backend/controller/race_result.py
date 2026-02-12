from flask import Blueprint, jsonify, request
from mysql.connector import Error
from datetime import datetime, timezone
from classes.race_result import RaceResult
from classes.meet_result import MeetResult
from classes.dog_owner import DogOwner
from classes.dog import Dog
from classes.dog_title import DogTitle
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from utils.auth_helpers import current_editor_id, current_role, require_scope

race_result_bp = Blueprint("race_result", __name__, url_prefix="/api/race_result")

def _is_owner(cwa_number):
    pid = current_editor_id()
    return DogOwner.exists(cwa_number, pid) if pid else False


@race_result_bp.post("/add")
def register_race_result():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_race_results_scope, "create race results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    race_result = RaceResult.from_request_data(data)

    if role.edit_race_results_scope == UserRole.SELF and not _is_owner(race_result.cwa_number):
        return jsonify({"ok": False, "error": "You can only add race results for dogs you own"}), 403

    race_result.last_edited_by = current_editor_id()
    race_result.last_edited_at = datetime.now(timezone.utc)

    validation_errors = race_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if RaceResult.exists(race_result.meet_number, race_result.program, race_result.race_number, race_result.cwa_number):
        return jsonify({"ok": False, "error": "Race result already exists"}), 409

    try:
        race_result.save()

        ChangeLog.log(
            changed_table="RaceResult",
            record_pk=f"{race_result.meet_number}|{race_result.program}|{race_result.race_number}|{race_result.cwa_number}",
            operation="INSERT",
            changed_by=current_editor_id(),
            source="api/race_result/add POST",
            before_obj=None,
            after_obj=race_result.to_dict(),
        )

        meet_result = MeetResult.find_by_identifier(race_result.meet_number, race_result.cwa_number)
        if meet_result:
            meet_result.update_from_race_results()
        
        dog = Dog.find_by_identifier(race_result.cwa_number)
        if dog:
            dog.update_from_meet_results()
            DogTitle.sync_titles_for_dog(dog, current_editor_id(), datetime.now(timezone.utc))

        return jsonify({"ok": True}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@race_result_bp.post("/edit")
def edit_race_result():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_race_results_scope, "edit race results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    meet_number = (data.get("meetNumber") or "").strip()
    program = (data.get("program") or "").strip()
    race_number = (data.get("raceNumber") or "").strip()
    cwa_number = (data.get("cwaNumber") or "").strip()

    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400
    if not program:
        return jsonify({"ok": False, "error": "Program is required"}), 400
    if not race_number:
        return jsonify({"ok": False, "error": "Race number is required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400

    existing = RaceResult.find_by_identifier(meet_number, program, race_number, cwa_number)
    if not existing:
        return jsonify({"ok": False, "error": "Race result does not exist"}), 404

    if role.edit_race_results_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "You can only edit race results for dogs you own"}), 403

    before_snapshot = existing.to_dict()

    race_result = RaceResult.from_request_data(data)
    race_result.meet_number = meet_number
    race_result.program = program
    race_result.race_number = race_number
    race_result.cwa_number = cwa_number
    race_result.last_edited_by = current_editor_id()
    race_result.last_edited_at = datetime.now(timezone.utc)

    validation_errors = race_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        race_result.update()

        refreshed = RaceResult.find_by_identifier(meet_number, program, race_number, cwa_number)
        after_snapshot = refreshed.to_dict() if refreshed else race_result.to_dict()

        ChangeLog.log(
            changed_table="RaceResult",
            record_pk=f"{meet_number}|{program}|{race_number}|{cwa_number}",
            operation="UPDATE",
            changed_by=current_editor_id(),
            source="api/race_result/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        meet_result = MeetResult.find_by_identifier(meet_number, cwa_number)
        if meet_result:
            meet_result.update_from_race_results()
        
        dog = Dog.find_by_identifier(cwa_number)
        if dog:
            dog.update_from_meet_results()
            DogTitle.sync_titles_for_dog(dog, current_editor_id(), datetime.now(timezone.utc))

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@race_result_bp.post("/delete")
def delete_race_result():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_race_results_scope, "delete race results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    meet_number = (data.get("meetNumber") or "").strip()
    program = (data.get("program") or "").strip()
    race_number = (data.get("raceNumber") or "").strip()
    cwa_number = (data.get("cwaNumber") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400
    if not program:
        return jsonify({"ok": False, "error": "Program is required"}), 400
    if not race_number:
        return jsonify({"ok": False, "error": "Race number is required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400

    race_result = RaceResult.find_by_identifier(meet_number, program, race_number, cwa_number)
    if not race_result:
        return jsonify({"ok": False, "error": "Race result does not exist"}), 404

    if role.edit_race_results_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "You can only delete race results for dogs you own"}), 403

    try:
        before_snapshot = race_result.to_dict()
        race_result.delete(meet_number, program, race_number, cwa_number)

        ChangeLog.log(
            changed_table="RaceResult",
            record_pk=f"{meet_number}|{program}|{race_number}|{cwa_number}",
            operation="DELETE",
            changed_by=current_editor_id(),
            source="api/race_result/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        meet_result = MeetResult.find_by_identifier(meet_number, cwa_number)
        if meet_result:
            meet_result.update_from_race_results()
        
        dog = Dog.find_by_identifier(cwa_number)
        if dog:
            dog.update_from_meet_results()
            DogTitle.sync_titles_for_dog(dog, current_editor_id(), datetime.now(timezone.utc))

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@race_result_bp.get("/get/<meet_number>/<program>/<race_number>/<cwa_number>")
def get_race_result(meet_number, program, race_number, cwa_number):
    race_result = RaceResult.find_by_identifier(meet_number, program, race_number, cwa_number)
    if not race_result:
        return jsonify({"ok": False, "error": "Race result does not exist"}), 404
    return jsonify({"ok": True, "data": race_result.to_dict()}), 200


@race_result_bp.get("/get")
def list_all_race_results():
    try:
        race_results = RaceResult.list_all_race_results()
        return jsonify({"ok": True, "data": [rr.to_dict() for rr in race_results]}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500