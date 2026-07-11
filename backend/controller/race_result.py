from flask import Blueprint, jsonify, request
from mysql.connector import Error
from datetime import datetime, timezone
from classes.race_result import RaceResult
from classes.meet_result import MeetResult
from classes.dog import Dog
from classes.dog_title import DogTitle
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from classes.meet import Meet
from utils.auth_helpers import current_editor_id, current_role, require_scope
from utils.error_handler import handle_error
from database import fetch_one, fetch_all
from controller.meet_result import _meet_stats

race_result_bp = Blueprint("race_result", __name__, url_prefix="/api/race_result")

def _is_judge_or_secretary(meet_number: str) -> bool:
    meet = Meet.find_by_identifier(meet_number)
    if not meet:
        return False
    pid = current_editor_id()
    if not pid:
        return False
    return meet.judge == pid or meet.race_secretary == pid

def _apply_meet_stats_delta(dog: Dog, old: dict, new: dict, editor_id: str, now: datetime):
    dog.meet_points = float(dog.meet_points or 0) - old["meet_points"] + new["meet_points"]
    dog.arx_points = float(dog.arx_points or 0) - old["arx_points"] + new["arx_points"]
    dog.narx_points = float(dog.narx_points or 0) - old["narx_points"] + new["narx_points"]

    dog.show_points = int(dog.show_points or 0) - int(old["show_points"]) + int(new["show_points"])
    dog.dpc_legs = int(dog.dpc_legs or 0) - int(old["dpc_legs"]) + int(new["dpc_legs"])
    dog.meet_wins = int(dog.meet_wins or 0) - int(old["meet_wins"]) + int(new["meet_wins"])
    dog.meet_appearences = int(dog.meet_appearences or 0) - int(old["meet_appearences"]) + int(new["meet_appearences"])
    dog.dpc_points = float(getattr(dog, "dpc_points", 0) or 0) - old["dpc_points"] + new["dpc_points"]

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


@race_result_bp.post("/delete")
def delete_race_result():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_scope, "delete race results")
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

    race_result = RaceResult.find_by_identifier(meet_number, cwa_number, program, race_number)
    if not race_result:
        return jsonify({"ok": False, "error": "Race result does not exist"}), 404

    if role.edit_meet_scope == UserRole.SELF and not _is_judge_or_secretary(meet_number):
        return jsonify({"ok": False, "error": "You can only delete race results for meets where you are a judge or race secretary"}), 403

    editor_id = current_editor_id()
    now = datetime.now(timezone.utc)

    try:
        before_snapshot = race_result.to_dict()
        race_result.delete(meet_number, cwa_number, program, race_number)

        ChangeLog.log(
            changed_table="RaceResults",
            record_pk=f"{meet_number}|{cwa_number}|{program}|{race_number}",
            operation="DELETE",
            changed_by=editor_id,
            source="api/race_result/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        _sync_after_race_change(meet_number, cwa_number, editor_id, now)

        return jsonify({"ok": True}), 200

    except Error as e:
        return handle_error(e, "Database error")


@race_result_bp.get("/get/<meet_number>/<program>/<race_number>/<cwa_number>")
def get_race_result(meet_number, program, race_number, cwa_number):
    race_result = RaceResult.find_by_identifier(meet_number, cwa_number, program, race_number)
    if not race_result:
        return jsonify({"ok": False, "error": "Race result does not exist"}), 404
    return jsonify({"ok": True, "data": race_result.to_dict()}), 200


@race_result_bp.get("/get")
def list_all_race_results():
    try:
        race_results = RaceResult.list_all_race_results()
        return jsonify({"ok": True, "data": [rr.to_dict() for rr in race_results]}), 200
    except Error as e:
        return handle_error(e, "Database error")


def _get_race_entries(meet_number: str, program: str, race_number: str):
    rows = fetch_all(
        """
        SELECT
            rr.CWANumber AS CWANumber,
            rr.Placement AS Placement,
            rr.MeetPoints AS MeetPoints,
            rr.AOMEarned AS AOMEarned,
            rr.DPCPoints AS DPCPoints,
            rr.Box AS Box,
            rr.Incident AS Incident,
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
                "meetPoints": row.get("MeetPoints"),
                "aomEarned": row.get("AOMEarned"),
                "dpcPoints": row.get("DPCPoints"),
                "box": row.get("Box"),
                "incident": row.get("Incident"),
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
        return handle_error(e, "Database error")
    except Exception as e:
        return handle_error(e, "Server error")

@race_result_bp.get("/points_distribution/<meet_number>/<program>/<race_number>/<cwa_number>")
def get_placement_and_dpc_points(meet_number, program, race_number, cwa_number):
    try:
        rows = _get_race_entries(meet_number, program, race_number)

        if not rows:
            return jsonify({"ok": False, "error": "Race does not exist or has no entries"}), 404

        entries = []
        for row in rows:

            entries.append({
                "cwaNumber": row.get("CWANumber"),
                "placement": row.get("Placement"),
            })
        
        count_adults = RaceResult.count_num_adult_whippets([entry["cwaNumber"] for entry in entries])
        dpc_points_distribution = RaceResult.get_dpc_point_distribution(count_adults)

        dog = Dog.find_by_identifier(cwa_number) if cwa_number else None
        race_result = RaceResult.find_by_identifier(meet_number, cwa_number, program, race_number) if cwa_number else None

        results = []
        for entry in entries:
            placement = entry.get("placement")

            placement_points = 0
            dpc_points = 0
            if dog and placement:
                placement_points = RaceResult.get_placement_points(placement)
                if len(dpc_points_distribution) > 0 and not dog.is_dpc() and not dog.is_akc_or_ckc():
                    dpc_points = dpc_points_distribution.pop()
            
            if placement == "AOM":
                race_result.aom_earned += 1
            race_result.meet_points = placement_points
            race_result.dpc_points = dpc_points
            race_result.update()

            results.append({
                "cwaNumber": entry.get("cwaNumber"),
                "dogName": entry.get("dogName"),
                "registeredName": entry.get("registeredName"),
                "callName": entry.get("callName"),
                "placement": placement,
                "placementPoints": placement_points,
                "dpcPoints": dpc_points,
            })

            if placement > 4 and len(dpc_points_distribution) == 0:
                break
                    
        return jsonify({
            "ok": True,
            "data": {
                "results": results
            }
        }), 200

    except Error as e:
        return handle_error(e, "Database error")
    except Exception as e:
        return handle_error(e, "Server error")
    
    
