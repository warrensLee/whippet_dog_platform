from flask import Blueprint, jsonify, request
from mysql.connector import Error
from datetime import datetime, timezone
from classes.meet_result import MeetResult
from classes.dog_owner import DogOwner
from classes.dog import Dog
from classes.dog_title import DogTitle
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from classes.race_result import RaceResult
from utils.auth_helpers import current_editor_id, current_role, require_scope
from utils.error_handler import handle_error
from database import fetch_one, fetch_all, execute

meet_result_bp = Blueprint("meet_result", __name__, url_prefix="/api/meet_result")

def _is_owner(cwa_number: str) -> bool:
    pid = current_editor_id()
    return DogOwner.exists(cwa_number, pid) if pid else False


# def _meet_stats(cwa_number: str) -> dict:
#     row = fetch_one(
#         """
#         SELECT
#             COALESCE(SUM(MeetPoints),0) AS meet_points,
#             COALESCE(SUM(ARXEarned),0)  AS arx_points,
#             COALESCE(SUM(NARXEarned),0) AS narx_points,
#             COALESCE(SUM(ShowPoints),0) AS show_points,
#             COALESCE(SUM(DPCLeg),0)     AS dpc_legs,
#             COALESCE(SUM(CASE WHEN MeetPlacement=1 THEN 1 ELSE 0 END),0) AS meet_wins,
#             COALESCE(COUNT(*),0)        AS meet_appearences,
#             COALESCE(SUM(DPCPoints),0)  AS dpc_points
#         FROM MeetResults
#         WHERE CWANumber=%s
#         """,
#         (cwa_number,),
#     ) or {}

#     return {
#         "meet_points": float(row.get("meet_points") or 0),
#         "arx_points": float(row.get("arx_points") or 0),
#         "narx_points": float(row.get("narx_points") or 0),
#         "show_points": float(row.get("show_points") or 0),
#         "dpc_legs": float(row.get("dpc_legs") or 0),
#         "meet_wins": float(row.get("meet_wins") or 0),
#         "meet_appearences": float(row.get("meet_appearences") or 0),
#         "dpc_points": float(row.get("dpc_points") or 0),
#     }

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
            COALESCE(COUNT(*),0)        AS meet_appearences,
            COALESCE(SUM(DPCPoints),0)  AS dpc_points
        FROM MeetResults
        WHERE CWANumber=%s
        """,
        (cwa_number,),
    ) or {}

    hc_row = fetch_one(
        """
        SELECT COUNT(*) as hc_wins
        FROM MeetResults mr
        WHERE mr.CWANumber = %s
          AND mr.MeetPlacement IS NOT NULL
          AND mr.ConformationPlacement IS NOT NULL
          AND mr.MeetPlacement + mr.ConformationPlacement = (
              SELECT MIN(inner_mr.MeetPlacement + inner_mr.ConformationPlacement)
              FROM MeetResults inner_mr
              WHERE inner_mr.MeetNumber = mr.MeetNumber
                AND inner_mr.MeetPlacement IS NOT NULL
                AND inner_mr.ConformationPlacement IS NOT NULL
          )
          AND mr.MeetPlacement = (
              SELECT MIN(inner_mr.MeetPlacement)
              FROM MeetResults inner_mr
              WHERE inner_mr.MeetNumber = mr.MeetNumber
                AND inner_mr.MeetPlacement IS NOT NULL
                AND inner_mr.ConformationPlacement IS NOT NULL
                AND inner_mr.MeetPlacement + inner_mr.ConformationPlacement = (
                    SELECT MIN(inner2.MeetPlacement + inner2.ConformationPlacement)
                    FROM MeetResults inner2
                    WHERE inner2.MeetNumber = mr.MeetNumber
                      AND inner2.MeetPlacement IS NOT NULL
                      AND inner2.ConformationPlacement IS NOT NULL
                )
          )
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
        "dpc_points": float(row.get("dpc_points") or 0),
        "high_combined_wins": int(hc_row.get("hc_wins") or 0),
    }

def _apply_meet_stats_delta(dog: Dog, old: dict, new: dict, editor_id: str, now: datetime):
    dog.meet_points = float(dog.meet_points or 0) - old["meet_points"] + new["meet_points"]
    dog.arx_points = float(dog.arx_points or 0) - old["arx_points"] + new["arx_points"]
    dog.narx_points = float(dog.narx_points or 0) - old["narx_points"] + new["narx_points"]
    dog.show_points = int(dog.show_points or 0) - int(old["show_points"]) + int(new["show_points"])
    dog.dpc_points = float(getattr(dog, "dpc_points", 0) or 0) - old["dpc_points"] + new["dpc_points"]
    dog.dpc_legs = int(dog.dpc_legs or 0) - int(old["dpc_legs"]) + int(new["dpc_legs"])
    dog.meet_wins = int(dog.meet_wins or 0) - int(old["meet_wins"]) + int(new["meet_wins"])
    dog.meet_appearences = int(dog.meet_appearences or 0) - int(old["meet_appearences"]) + int(new["meet_appearences"])
    dog.high_combined_wins = int(new["high_combined_wins"])
    if hasattr(dog, "compute_last_three_meet_average"):
        dog.average = dog.compute_last_three_meet_average()
    dog.update()
    DogTitle.sync_titles_for_dog(dog, editor_id, now)

@meet_result_bp.post("/add")
def register_meet_result():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_scope, "create meet results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    meet_result = MeetResult.from_request_data(data)

    if role.edit_meet_scope == UserRole.SELF and not _is_owner(meet_result.cwa_number):
        return jsonify({"ok": False, "error": "You can only add meet results for dogs you own"}), 403

    editor_id = current_editor_id()
    now = datetime.now(timezone.utc)
    meet_result.last_edited_by = editor_id
    meet_result.last_edited_at = now

    validation_errors = meet_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if MeetResult.exists(meet_result.meet_number, meet_result.cwa_number):
        return jsonify({"ok": False, "error": "Meet result already exists"}), 409

    try:
        dog = Dog.find_by_identifier(meet_result.cwa_number)
        old_stats = _meet_stats(meet_result.cwa_number) if dog else None
        meet_result.save()

        ChangeLog.log(
            changed_table="MeetResults",
            record_pk=f"{meet_result.meet_number}|{meet_result.cwa_number}",
            operation="INSERT",
            changed_by=editor_id,
            source="api/meet_result/add POST",
            before_obj=None,
            after_obj=meet_result.to_dict(),
        )

        if dog:
            new_stats = _meet_stats(meet_result.cwa_number)
            _apply_meet_stats_delta(dog, old_stats, new_stats, editor_id, now)

        return jsonify({"ok": True}), 201

    except Error as e:
        return handle_error(e, "Database error")


@meet_result_bp.post("/edit")
def edit_meet_result():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_scope, "edit meet results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    meet_number = (data.get("meetNumber") or "").strip()
    cwa_number = (data.get("cwaNumber") or "").strip()

    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400

    existing = MeetResult.find_by_identifier(meet_number, cwa_number)
    if not existing:
        return jsonify({"ok": False, "error": "Meet result does not exist"}), 404

    if role.edit_meet_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "You can only edit meet results for dogs you own"}), 403

    editor_id = current_editor_id()
    now = datetime.now(timezone.utc)

    before_snapshot = existing.to_dict()

    meet_result = MeetResult.from_request_data(data)
    meet_result.meet_number = meet_number
    meet_result.cwa_number = cwa_number
    meet_result.last_edited_by = editor_id
    meet_result.last_edited_at = now

    validation_errors = meet_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        dog = Dog.find_by_identifier(cwa_number)
        old_stats = _meet_stats(cwa_number) if dog else None

        meet_result.update()

        refreshed = MeetResult.find_by_identifier(meet_number, cwa_number)
        after_snapshot = refreshed.to_dict() if refreshed else meet_result.to_dict()

        ChangeLog.log(
            changed_table="MeetResults",
            record_pk=f"{meet_number}|{cwa_number}",
            operation="UPDATE",
            changed_by=editor_id,
            source="api/meet_result/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        if dog:
            new_stats = _meet_stats(cwa_number)
            _apply_meet_stats_delta(dog, old_stats, new_stats, editor_id, now)

        return jsonify({"ok": True}), 200

    except Error as e:
        return handle_error(e, "Database error")


@meet_result_bp.post("/delete")
def delete_meet_result():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_scope, "delete meet results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    meet_number = (data.get("meetNumber") or "").strip()
    cwa_number = (data.get("cwaNumber") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400

    meet_result = MeetResult.find_by_identifier(meet_number, cwa_number)
    if not meet_result:
        return jsonify({"ok": False, "error": "Meet result does not exist"}), 404

    if role.edit_meet_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "You can only delete meet results for dogs you own"}), 403

    editor_id = current_editor_id()
    now = datetime.now(timezone.utc)

    try:
        dog = Dog.find_by_identifier(cwa_number)
        old_stats = _meet_stats(cwa_number) if dog else None
        before_snapshot = meet_result.to_dict()

        meet_result.delete(meet_number, cwa_number)

        ChangeLog.log(
            changed_table="MeetResults",
            record_pk=f"{meet_number}|{cwa_number}",
            operation="DELETE",
            changed_by=editor_id,
            source="api/meet_result/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        if dog:
            new_stats = _meet_stats(cwa_number)
            _apply_meet_stats_delta(dog, old_stats, new_stats, editor_id, now)

        return jsonify({"ok": True}), 200

    except Error as e:
        return handle_error(e, "Database error")


@meet_result_bp.get("/get/<meet_number>/<cwa_number>")
def get_meet_result(meet_number, cwa_number):
    meet_result = MeetResult.find_by_identifier(meet_number, cwa_number)
    if not meet_result:
        return jsonify({"ok": False, "error": "Meet result does not exist"}), 404
    return jsonify({"ok": True, "data": meet_result.to_dict()}), 200


@meet_result_bp.get("/get")
def list_all_meet_results():
    try:
        meet_results = MeetResult.list_all_meet_results()
        return jsonify({"ok": True, "data": [mr.to_dict() for mr in meet_results]}), 200
    except Error as e:
        return handle_error(e, "Database error")
    
@meet_result_bp.get("/by_meet/<meet_number>")
def list_meet_results_for_meet(meet_number):
    try:
        meet_results = MeetResult.list_results_for_meet(meet_number)
        return jsonify({"ok": True, "data": [mr.to_dict() for mr in meet_results]}), 200
    except Error as e:
        return handle_error(e, "Database error")
    
@meet_result_bp.get("/final_by_meet/<meet_number>")
def list_final_meet_results_for_meet(meet_number):
    try:
        rows = MeetResult.list_final_results_for_meet(meet_number)

        data = [
            {
                "cwaNumber": row.get("CWANumber"),
                "place": row.get("MeetPlacement"),
                "grade": row.get("Grade"),
                "callName": row.get("CallName"),
                "registeredName": row.get("RegisteredName"),
                "ownerName": row.get("OwnerName"),
                "ownerIDs": row.get("OwnerIDs"),
                "meetPoints": row.get("MeetPoints"),
                "arxEarned": row.get("ARXEarned"),
                "narxEarned": row.get("NARXEarned"),
                "incident": row.get("Incident"),
                "hcScore": row.get("HCScore"),
                "matchPoints": row.get("MatchPoints"),
                "dpcPoints": row.get("DPCPoints"),
                "entryType": row.get("EntryType"),
            }
            for row in rows
        ]

        return jsonify({"ok": True, "data": data}), 200
    except Error as e:
        return handle_error(e, "Database error")


@meet_result_bp.get("/edit_result_view/<meet_number>")
def edit_result_view(meet_number):
    try:
        combined_rows = fetch_all(
            """
            SELECT 
                rr.Program,
                rr.RaceNumber,
                rr.EntryType,
                rr.Box,
                rr.Placement,
                rr.Incident,
                rr.CWANumber,
                mr.Shown,
                mr.ShowPoints,
                mr.ShowPlacement,
                mr.Grade,
                mr.Average,
                dd.RegisteredName,
                dd.CallName
            FROM RaceResults rr
            LEFT JOIN MeetResults mr 
                ON rr.CWANumber = mr.CWANumber 
                AND rr.MeetNumber = mr.MeetNumber
            LEFT JOIN Dog dd
                ON dd.CWANumber = mr.CWANumber
            WHERE rr.MeetNumber = %s
            ORDER BY rr.CWANumber ASC, rr.Program ASC, rr.RaceNumber ASC
            """,
            (meet_number,),
        ) or []

        if not combined_rows:
            return jsonify({"ok": True, "entries": []}), 200

        dog_data = {}
        
        for row in combined_rows:
            cwa_number = row.get("CWANumber")
            
            if cwa_number not in dog_data:
                dog_data[cwa_number] = {
                    "cwaNumber": cwa_number,
                    "registeredName": row.get("RegisteredName") or "",
                    "callName": row.get("CallName") or "",
                    "shown": bool(row.get("Shown") == "1"),
                    "showPoints": int(row.get("ShowPoints") or 0),
                    "showPlace": int(row.get("ShowPlacement") or 0),
                    "grade": row.get("Grade") or "",
                    "average": int(row.get("Average") or 0),
                    "races": []
                }
            
            dog_data[cwa_number]["races"].append({
                "program": row.get("Program") or "",
                "race": row.get("RaceNumber") or "",
                "entryType": row.get("EntryType") or "",
                "box": row.get("Box") or "",
                "placement": row.get("Placement") or "",
                "incident": row.get("Incident") or ""
            })

        dog_entries = list(dog_data.values())

        return jsonify({"ok": True, "entries": dog_entries}), 200

    except Error as e:
        return handle_error(e, "Database error")


@meet_result_bp.post("/edit_result_view/<meet_number>")
def bulk_update_edit_result_view(meet_number):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_scope, "edit meet results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    entries = data.get("entries", []) or []

    editor_id = current_editor_id()
    now = datetime.now(timezone.utc)

    try:
        cwa_numbers = [entry.get("cwaNumber") for entry in entries if entry.get("cwaNumber")]

        old_stats = {}
        if cwa_numbers:
            cwa_placeholders = ",".join(["%s"] * len(cwa_numbers))
            existing_rows = fetch_all(
                f"""
                SELECT CWANumber, Shown, ShowPoints, ShowPlacement
                FROM MeetResults
                WHERE MeetNumber = %s AND CWANumber IN ({cwa_placeholders})
                """,
                [meet_number] + cwa_numbers
            ) or []
            
            for row in existing_rows:
                cwa = row["CWANumber"]
                if cwa not in old_stats:
                    old_stats[cwa] = _meet_stats(cwa)

        execute("DELETE FROM RaceResults WHERE MeetNumber = %s", (meet_number,))
        execute("DELETE FROM MeetResults WHERE MeetNumber = %s", (meet_number,))

        for entry in entries:
            cwa_number = entry.get("cwaNumber")
            if not cwa_number:
                continue
                
            shown = 1 if entry.get("shown") else 0
            show_points = int(entry.get("showPoints") or 0)
            show_placement = int(entry.get("showPlace") or 0)
            grade = entry.get("grade")
            average = float(entry.get("average") or 0)
            
            races = entry.get("races") or []
            for race in races:
                program = race.get("program")
                race_number = race.get("race")
                entry_type = race.get("entryType")
                box = race.get("box") or ""
                placement = race.get("placement")
                incident = race.get("incident") or ""
                
                if not program or not race_number:
                    continue

                placement_str = str(placement).strip() if placement else ""
                
                try:
                    placement_num = int(placement_str) if placement_str.isdigit() else 0
                except (ValueError, TypeError):
                    placement_num = 0
                
                if placement_num > 0:
                    rr = RaceResult("", "", "", "", "", "", placement_str, "", "", "", "", None, None)
                    meet_points = rr.get_placement_points(placement_str)
                elif placement_str.upper() == "AOM":
                    meet_points = 0.5
                else:
                    meet_points = 0

                execute(
                    """
                    INSERT INTO RaceResults (
                        MeetNumber, CWANumber, Program, RaceNumber, EntryType, Box,
                        Placement, MeetPoints, AOMEarned, DPCPoints, Incident,
                        LastEditedBy, LastEditedAt
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (meet_number, cwa_number, program, race_number, entry_type, box,
                     placement_str, meet_points, 0, 0, incident, editor_id, now),
                )

            new_result = MeetResult(meet_number, cwa_number, average, grade, 0, 0, 0, 0, 0, 0, shown, show_placement, show_points, 0, 0, 0, 0, 0, editor_id, now)
            new_result.save()
            new_result.update_from_race_results()
        
        default_old = {
            "meet_points": 0, "arx_points": 0, "narx_points": 0,
            "show_points": 0, "dpc_legs": 0, "meet_wins": 0,
            "meet_appearences": 0, "dpc_points": 0, "high_combined_wins": 0
        }
        if cwa_numbers:
            for cwa in cwa_numbers:
                dog = Dog.find_by_identifier(cwa)
                if dog:
                    new_stats = _meet_stats(cwa)
                    old = old_stats.get(cwa, default_old)
                    _apply_meet_stats_delta(dog, old, new_stats, editor_id, now)

        RaceResult.calculate_dpc_leg_for_meet(meet_number)
        RaceResult.calculate_hc_leg_for_meet(meet_number)

        return jsonify({"ok": True}), 200

    except Error as e:
        return handle_error(e, "Database error")

