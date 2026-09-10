from flask import Blueprint, jsonify, request
from mysql.connector import Error
from datetime import datetime, timezone
from backend.classes.meet_result import MeetResult
from backend.classes.dog import Dog
from backend.classes.dog_title import DogTitle
from backend.classes.user_role import UserRole
from backend.classes.race_result import RaceResult
from backend.classes.meet import Meet
from backend.utils.auth_helpers import current_editor_id, current_role, require_scope
from backend.utils.error_handler import handle_error
from backend.database import fetch_one, fetch_all, execute

meet_result_bp = Blueprint("meet_result", __name__, url_prefix="/api/meet_result")

def _is_judge_or_secretary(meet_number: str) -> bool:
    meet = Meet.find_by_identifier(meet_number)
    if not meet:
        return False
    pid = current_editor_id()
    if not pid:
        return False
    return meet.judge == pid or meet.race_secretary == pid

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


@meet_result_bp.get("/edit_result_view/<meet_number>")
def edit_result_view(meet_number):
    try:
        combined_rows = fetch_all(
            """
            SELECT 
                rr.Program,
                rr.RaceNumber,
                rr.Box,
                rr.Placement,
                rr.Incident,
                rr.CWANumber,
                mr.EntryType,
                mr.ARXEarned,
                mr.NARXEarned,
                mr.DPCPoints as meetDPC,
                mr.HCLegEarned,
                mr.Shown,
                mr.ShowPoints,
                mr.ShowPlacement,
                mr.Grade,
                mr.Average,
                mr.MeetPlacement,
                mr.MeetPoints,
                mr.AOMEarned,
                mr.DPCLeg,
                dd.RegisteredName,
                 dd.CallName,
                 dd.Birthdate,
                 dd.ARXPoints,
                 dd.NARXPoints,
                 dd.DPCPoints AS dogDPC
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
            return jsonify({"ok": True, "dogs": [], "races": {}}), 200

        dog_data = {}
        race_data = {}
        
        for row in combined_rows:
            cwa_number = row.get("CWANumber")
            
            if cwa_number not in dog_data:
                dog_data[cwa_number] = {
                    "cwaNumber": cwa_number,
                    "registeredName": row.get("RegisteredName") or "",
                    "callName": row.get("CallName") or "",
                    "shown": bool(row.get("Shown") == "1"),
                    "showPoints":float(row.get("ShowPoints") or 0),
                    "showPlace": row.get("ShowPlacement") or "0",
                    "grade": row.get("Grade") or "",
                    "average": float(row.get("Average") or 0),
                    "dpcPoints": int(row.get("meetDPC") or 0),
                    "NARXEarned": float(row.get("NARXEarned") or 0),
                    "ARXEarned": float(row.get("ARXEarned") or 0),
                    "hcLegEarned": bool(row.get("HCLegEarned") == "1"),
                    "entryType": row.get("EntryType") or "",
                    "meetPlacement": int(row.get("MeetPlacement") or 0),
                    "meetPoints": float(row.get("MeetPoints") or 0),
                    "dpcLeg": row.get("DPCLeg") == "1",
                    "aomEarned": float(row.get("AOMEarned") or 0) if row.get("AOMEarned") is not None else 0,
                    "birthdate": row.get("Birthdate") or "",
                    "arxPoints": float(row.get("ARXPoints") or 0),
                    "narxPoints": float(row.get("NARXPoints") or 0),
                    "dpcTitle": bool(int(row.get("dogDPC") or 0) >= 15),
                }
            
            program = row.get("Program") or "1"
            race = row.get("RaceNumber") or "1"

            if program not in race_data:
                race_data[program] = {}

            if race not in race_data[program]:
                race_data[program][race] = []
            
            race_data[program][race].append({
                "dog": row.get("CWANumber") or "",
                "box": row.get("Box") or "",
                "placement": row.get("Placement") or "",
                "incident": row.get("Incident") or ""
            })

        dog_entries = list(dog_data.values())

        return jsonify({"ok": True, "dogs": dog_entries, "races": race_data}), 200

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

    if role.edit_meet_scope == UserRole.SELF and not _is_judge_or_secretary(meet_number):
        return jsonify({"ok": False, "error": "You can only edit meet results for meets where you are a judge or race secretary"}), 403

    data = request.get_json(silent=True) or {}
    entries = data.get("entries", []) or []

    editor_id = current_editor_id()
    now = datetime.now(timezone.utc)

    try:
        cwa_numbers = [entry.get("cwaNumber") for entry in entries if entry.get("cwaNumber")]

        all_in_meet = fetch_all(
            "SELECT DISTINCT CWANumber FROM MeetResults WHERE MeetNumber = %s",
            (meet_number,),
        ) or []
        all_in_meet_set = {x for x in [row["CWANumber"] for row in all_in_meet] + [n for n in cwa_numbers]}


        execute("DELETE FROM RaceResults WHERE MeetNumber = %s", (meet_number,))
        execute("DELETE FROM MeetResults WHERE MeetNumber = %s", (meet_number,))

        for entry in entries:
            cwa_number = entry.get("cwaNumber")
            if not cwa_number:
                continue
                
            shown = 1 if entry.get("shown") else 0
            show_points = float(entry.get("showPoints") or 0)

            show_placement = entry.get("showPlace") or "0"
            if entry.get("showPlace") == "N/A":
                show_placement = "0"

            arx_earned = int(entry.get("ARXEarned") or 0)
            narx_earned = int(entry.get("NARXEarned") or 0)
            dpc_points = int(entry.get("dpcPoints") or 0)
            dpc_leg = 1 if entry.get("dpcLeg") == "1" else 0
            grade = entry.get("grade")
            entry_type = entry.get("entryType")
            average = float(entry.get("average") or 0)
            hcWinner = bool(entry.get("hcWinner") or False)
            aomEarned = float(entry.get("aomEarned") or 0)
            meet_placement_str = str(entry.get("meetPlacement") or 0).strip()
            meet_points_str = str(entry.get("meetPoints") or 0).strip()
            races = entry.get("races") or []
            for race in races:
                program = race.get("program")
                race_number = race.get("race")
                box = race.get("box") or None
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
                    rr = RaceResult("", "", "", "", "", placement_str, "", "", "", "", None, None)
                    meet_points = rr.get_placement_points(placement_str)
                elif placement_str.upper() == "AOM":
                    meet_points = 0.5
                    placement_num = 0
                else:
                    meet_points = 0

                execute(
                    """
                    INSERT INTO RaceResults (
                        MeetNumber, CWANumber, Program, RaceNumber, Box,
                        Placement, MeetPoints, AOMEarned, DPCPoints, Incident,
                        LastEditedBy, LastEditedAt
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (meet_number, cwa_number, program, race_number, box,
                     placement_num, meet_points, 0, 0, incident, editor_id, now),
                )

            try:
                meet_points_val = float(meet_points_str) if meet_points_str and meet_points_str.isdigit() or meet_points_str.replace('.', '', 1).isdigit() else 0
            except (ValueError, TypeError):
                meet_points_val = 0


            new_result = MeetResult(meet_number, cwa_number, average, grade, int(meet_placement_str) if meet_placement_str and meet_placement_str.isdigit() else 0, 0, 0, meet_points_val, arx_earned, narx_earned, shown, show_placement, show_points, dpc_leg, 0, 1 if hcWinner else 0, aomEarned, dpc_points, entry_type, editor_id, now)
            new_result.save()

        for cwa in all_in_meet_set:
            dog = Dog.find_by_identifier(cwa)
            if dog:
                dog.update_from_meet_results()
                DogTitle.sync_titles_for_dog(dog, None, None)


        return jsonify({"ok": True}), 200

    except Error as e:
        return handle_error(e, "Database error")


@meet_result_bp.get("/final_by_meet/<meet_number>")
def list_final_meet_results_for_meet(meet_number):
    try:
        rows = MeetResult.list_final_results_for_meet(meet_number)

        data = []

        for index, row in enumerate(rows, 1):
            data.append({
                "cwaNumber": row.get("CWANumber"),
                "meetPlacement": row.get("MeetPlacement"),
                "grade": row.get("Grade"),
                "callName": row.get("CallName"),
                "registeredName": row.get("RegisteredName"),
                "entryType": row.get("EntryType"),
                "ownerName": row.get("OwnerName"),
                "ownerIDs": row.get("OwnerIDs"),
                "meetPoints": float(row.get("MeetPoints") or 0),
                "arxEarned": float(row.get("ARXEarned") or 0),
                "narxEarned": float(row.get("NARXEarned") or 0),
                "incident": row.get("Incident"),
                "hcScore": float(row.get("HCScore") or 0),
                "matchPoints": float(row.get("MatchPoints") or 0),
                "dpcPoints": float(row.get("DPCPoints") or 0),
                "shown": row.get("Shown") == "1",
                "showPlacement": row.get("ShowPlacement"),
                "showPoints": float(row.get("ShowPoints") or 0),
                "HCLegEarned": bool(row.get("HCLegEarned") == "1")
            })

        return jsonify({"ok": True, "data": data}), 200
    except Error as e:
        return handle_error(e, "Database error")


@meet_result_bp.get("/by_race/<meet_number>/<program>/<race_number>")
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