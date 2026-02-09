from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from datetime import datetime, timezone
from classes.race_result import RaceResult
from classes.change_log import ChangeLog
from classes.user_role import UserRole

race_result_bp = Blueprint("race_result", __name__, url_prefix="/api/race_result")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    return (u.get("PersonID") or u.get("personId") or u.get("id") or None)


def _current_role() -> UserRole | None:
    pid = _current_editor_id()
    if not pid:
        return None

    u = session.get("user") or {}
    title = u.get("SystemRole")
    if not title:
        return None

    return UserRole.find_by_title(title.strip().upper())


def _require_login():
    if not _current_editor_id():
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    return None


def _require_scope(scope_value: int, action: str):
    if int(scope_value or 0) == UserRole.NONE:
        return jsonify({"ok": False, "error": f"Not allowed to {action}"}), 403
    return None


@race_result_bp.post("/add")
def register_race_result():
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_race_results_scope, "create race results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    race_result = RaceResult.from_request_data(data)

    race_result.last_edited_by = _current_editor_id()
    race_result.last_edited_at = datetime.now(timezone.utc)

    validation_errors = race_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if RaceResult.exists(
        race_result.meet_number,
        race_result.cwa_number,
        race_result.program,
        race_result.race_number,
    ):
        return jsonify({"ok": False, "error": "Race result already exists"}), 409

    try:
        race_result.save()

        ChangeLog.log(
            changed_table="RaceResult",
            record_pk=f"{race_result.meet_number}|{race_result.cwa_number}|{race_result.program}|{race_result.race_number}",
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/race_result/add POST",
            before_obj=None,
            after_obj=race_result.to_dict(),
        )

        return jsonify({"ok": True}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@race_result_bp.post("/edit")
def edit_race_result():
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_race_results_scope, "edit race results")
    if deny:
        return deny

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
    race_result.last_edited_at = datetime.now(timezone.utc)

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

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@race_result_bp.post("/delete")
def delete_race_result():
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_race_results_scope, "delete race results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400

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

    try:
        existing = RaceResult.find_by_identifier(meet_number, cwa_number, program, race_number)
        if not existing:
            return jsonify({"ok": False, "error": "Race result does not exist"}), 404

        before_snapshot = existing.to_dict()
        existing.delete(meet_number, cwa_number, program, race_number)

        ChangeLog.log(
            changed_table="RaceResult",
            record_pk=f"{meet_number}|{cwa_number}|{program}|{race_number}",
            operation="DELETE",
            changed_by=_current_editor_id(),
            source="api/race_result/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@race_result_bp.get("/get/<meet_number>/<cwa_number>/<program>/<race_number>")
def get_race_result(meet_number: str, cwa_number: str, program: str, race_number: str):
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_race_results_scope, "view race results")
    if deny:
        return deny

    race_result = RaceResult.find_by_identifier(meet_number, cwa_number, program, race_number)
    if not race_result:
        return jsonify({"ok": False, "error": "Race result does not exist"}), 404

    return jsonify({"ok": True, "data": race_result.to_dict()}), 200


@race_result_bp.get("/get")
def list_all_race_results():
    login_err = _require_login()
    if login_err:
        return login_err

    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_race_results_scope, "view race results")
    if deny:
        return deny

    try:
        race_results = RaceResult.list_all_race_results()
        return jsonify({"ok": True, "data": [r.to_dict() for r in race_results]}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
