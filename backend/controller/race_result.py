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
from database import fetch_one, fetch_all

race_result_bp = Blueprint("race_result", __name__, url_prefix="/api/race_result")

def _is_owner(cwa_number: str) -> bool:
    pid = current_editor_id()
    return DogOwner.exists(cwa_number, pid) if pid else False

def _meet_stats(cwa_number: str) -> dict:
    row = fetch_one(
        """
        SELECT
            COALESCE(SUM(MeetPoints),0) AS meet_points,
            COALESCE(SUM(ARXEarned),0)  AS arx_points,
            COALESCE(SUM(NARXEarned),0) AS narx_points,
            COALESCE(SUM(ShowPoints),0) AS show_points,
            COALESCE(SUM(DPCLeg),0)     AS dpc_legs,
            COALESCE(SUM(CASE WHEN MeetPlacement=1 THEN 1 ELSE 0 END),0) AS meet_wins,
            COALESCE(COUNT(*),0)        AS meet_appearences
        FROM MeetResults
        WHERE CWANumber=%s
        """,
        (cwa_number,),
    ) or {}

    return {
        "meet_points": float(row.get("meet_points") or 0),
        "arx_points": float(row.get("arx_points") or 0),
        "narx_points": float(row.get("narx_points") or 0),
        "show_points": float(row.get("show_points") or 0),
        "dpc_legs": float(row.get("dpc_legs") or 0),
        "meet_wins": float(row.get("meet_wins") or 0),
        "meet_appearences": float(row.get("meet_appearences") or 0),
    }


def _apply_meet_stats_delta(dog: Dog, old: dict, new: dict, editor_id: str, now: datetime):
    dog.meet_points = float(dog.meet_points or 0) - old["meet_points"] + new["meet_points"]
    dog.arx_points = float(dog.arx_points or 0) - old["arx_points"] + new["arx_points"]
    dog.narx_points = float(dog.narx_points or 0) - old["narx_points"] + new["narx_points"]

    dog.show_points = int(dog.show_points or 0) - int(old["show_points"]) + int(new["show_points"])
    dog.dpc_legs = int(dog.dpc_legs or 0) - int(old["dpc_legs"]) + int(new["dpc_legs"])
    dog.meet_wins = int(dog.meet_wins or 0) - int(old["meet_wins"]) + int(new["meet_wins"])
    dog.meet_appearences = int(dog.meet_appearences or 0) - int(old["meet_appearences"]) + int(new["meet_appearences"])

    if hasattr(dog, "compute_last_three_meet_average"):
        dog.average = dog.compute_last_three_meet_average()

    dog.update()
    DogTitle.sync_titles_for_dog(dog, editor_id, now)


def _sync_after_race_change(meet_number: str, cwa_number: str, editor_id: str, now: datetime):
    """
    1) snapshot old MeetResults totals for dog
    2) update MeetResult from RaceResults (your existing method)
    3) snapshot new totals
    4) replace contribution on dog: dog = dog - old + new
    """
    dog = Dog.find_by_identifier(cwa_number)
    if not dog:
        return

    old_stats = _meet_stats(cwa_number)

    meet_result = MeetResult.find_by_identifier(meet_number, cwa_number)
    if meet_result:
        meet_result.update_from_race_results()

    new_stats = _meet_stats(cwa_number)
    _apply_meet_stats_delta(dog, old_stats, new_stats, editor_id, now)


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

    editor_id = current_editor_id()
    now = datetime.now(timezone.utc)

    race_result.last_edited_by = editor_id
    race_result.last_edited_at = now

    validation_errors = race_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if RaceResult.exists(race_result.meet_number, race_result.program, race_result.race_number, race_result.cwa_number):
        return jsonify({"ok": False, "error": "Race result already exists"}), 409

    try:
        race_result.save()

        ChangeLog.log(
            changed_table="RaceResults",
            record_pk=f"{race_result.meet_number}|{race_result.program}|{race_result.race_number}|{race_result.cwa_number}",
            operation="INSERT",
            changed_by=editor_id,
            source="api/race_result/add POST",
            before_obj=None,
            after_obj=race_result.to_dict(),
        )

        _sync_after_race_change(race_result.meet_number, race_result.cwa_number, editor_id, now)

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

    editor_id = current_editor_id()
    now = datetime.now(timezone.utc)

    before_snapshot = existing.to_dict()

    race_result = RaceResult.from_request_data(data)
    race_result.meet_number = meet_number
    race_result.program = program
    race_result.race_number = race_number
    race_result.cwa_number = cwa_number
    race_result.last_edited_by = editor_id
    race_result.last_edited_at = now

    validation_errors = race_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        race_result.update()

        refreshed = RaceResult.find_by_identifier(meet_number, program, race_number, cwa_number)
        after_snapshot = refreshed.to_dict() if refreshed else race_result.to_dict()

        ChangeLog.log(
            changed_table="RaceResults",
            record_pk=f"{meet_number}|{program}|{race_number}|{cwa_number}",
            operation="UPDATE",
            changed_by=editor_id,
            source="api/race_result/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        _sync_after_race_change(meet_number, cwa_number, editor_id, now)

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

    editor_id = current_editor_id()
    now = datetime.now(timezone.utc)

    try:
        before_snapshot = race_result.to_dict()
        race_result.delete(meet_number, program, race_number, cwa_number)

        ChangeLog.log(
            changed_table="RaceResults",
            record_pk=f"{meet_number}|{program}|{race_number}|{cwa_number}",
            operation="DELETE",
            changed_by=editor_id,
            source="api/race_result/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        _sync_after_race_change(meet_number, cwa_number, editor_id, now)

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


def _get_race_entries(meet_number: str, program: str, race_number: str):
    rows = fetch_all(
        """
        SELECT
            rr.CWANumber AS CWANumber,
            rr.Placement AS Placement,
            d.CallName AS CallName,
            d.RegisteredName AS RegisteredName
        FROM RaceResults rr
        LEFT JOIN Dog d ON d.CWANumber = rr.CWANumber
        WHERE rr.MeetNumber = %s
          AND rr.Program = %s
          AND rr.RaceNumber = %s
        ORDER BY
            CASE
                WHEN rr.Placement IS NULL THEN 9999
                ELSE rr.Placement
            END,
            d.RegisteredName,
            d.CallName
        """,
        (meet_number, program, race_number),
    ) or []

    return rows


@race_result_bp.get("/by_race/<meet_number>/<program>/<race_number>")
def get_race_entries(meet_number, program, race_number):
    try:
        rows = _get_race_entries(meet_number, program, race_number)

        if not rows:
            return jsonify({"ok": False, "error": "Race does not exist or has no entries"}), 404

        entries = []
        for row in rows:
            dog_name = row.get("CallName") or row.get("RegisteredName") or row.get("CWANumber")

            entries.append({
                "cwaNumber": row.get("CWANumber"),
                "dogName": dog_name,
                "registeredName": row.get("RegisteredName"),
                "callName": row.get("CallName"),
                "placement": row.get("Placement"),
                "points": row.get("Points"),
            })

        return jsonify({
            "ok": True,
            "data": {
                "meetNumber": meet_number,
                "program": program,
                "raceNumber": race_number,
                "entries": entries,
            }
        }), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": f"Server error: {str(e)}"}), 500