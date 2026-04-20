from flask import Blueprint, jsonify, request, session, Response
import csv
import io
from mysql.connector import Error
from datetime import datetime, timezone
from classes.meet import Meet
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from utils.auth_helpers import current_editor_id, current_role, require_scope
from utils.error_handler import handle_error
from database import fetch_all


meet_bp = Blueprint("meet", __name__, url_prefix="/api/meet")


def _is_meet_owner(meet: Meet):
    person_id = current_editor_id()
    if not person_id or not meet:
        return False


    return (meet.judge) == (person_id) or (meet.race_secretary) == (person_id)


@meet_bp.post("/add")
def register_meet():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_scope, "create meets")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    meet = Meet.from_request_data(data)

    if role.edit_meet_scope != UserRole.ALL:
        meet.private_notes = None

    meet.last_edited_by = current_editor_id()
    meet.last_edited_at = datetime.now(timezone.utc)

    validation_errors = meet.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Meet.exists(meet.meet_number):
        return jsonify({"ok": False, "error": "Meet already exists"}), 409

    if role.edit_meet_scope == UserRole.SELF and not _is_meet_owner(meet):
        return jsonify({"ok": False, "error": "Not allowed to create this meet"}), 403

    try:
        meet.save()

        ChangeLog.log(
            changed_table="Meet",
            record_pk=meet.meet_number,
            operation="INSERT",
            changed_by=current_editor_id(),
            source="api/meet/register POST",
            before_obj=None,
            after_obj=meet.to_dict(),
        )

        return jsonify({"ok": True}), 201

    except Error as e:
        return handle_error(e, "Database error")


@meet_bp.post("/edit")
def edit_meet():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_scope, "edit meets")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    meet_number = (data.get("meetNumber") or "").strip()
    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400

    existing = Meet.find_by_identifier(meet_number)
    if not existing:
        return jsonify({"ok": False, "error": "Meet does not exist"}), 404

    if role.edit_meet_scope == UserRole.SELF and not _is_meet_owner(existing):
        return jsonify({"ok": False, "error": "Not allowed to edit this meet"}), 403

    before_snapshot = existing.to_dict()

    meet = Meet.from_request_data(data)
    meet.meet_number = meet_number

    if role.edit_meet_scope != UserRole.ALL:
        meet.private_notes = existing.private_notes
        
    meet.last_edited_by = current_editor_id()
    meet.last_edited_at = datetime.now(timezone.utc)

    validation_errors = meet.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        meet.update()

        refreshed = Meet.find_by_identifier(meet_number)
        after_snapshot = refreshed.to_dict() if refreshed else meet.to_dict()

        ChangeLog.log(
            changed_table="Meet",
            record_pk=meet_number,
            operation="UPDATE",
            changed_by=current_editor_id(),
            source="api/meet/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        return jsonify({"ok": True}), 200

    except Error as e:
        return handle_error(e, "Database error")


@meet_bp.post("/delete")
def delete_meet():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_scope, "delete meets")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    meet_number = (data.get("meetNumber") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400

    try:
        meet = Meet.find_by_identifier(meet_number)
        if not meet:
            return jsonify({"ok": False, "error": "Meet does not exist"}), 404

        if role.edit_meet_scope == UserRole.SELF and not _is_meet_owner(meet):
            return jsonify({"ok": False, "error": "Not allowed to delete this meet"}), 403

        before_snapshot = meet.to_dict()

        meet.delete()

        ChangeLog.log(
            changed_table="Meet",
            record_pk=meet_number,
            operation="DELETE",
            changed_by=current_editor_id(),
            source="api/meet/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"ok": True}), 200

    except Error as e:
        return handle_error(e, "Database error")


@meet_bp.get("/get/<meet_number>")
def get_meet(meet_number):
    role = current_role()
    include_private = role is not None and role.edit_meet_scope == UserRole.ALL

    meet = Meet.find_by_identifier(meet_number)
    if not meet:
        return jsonify({"ok": False, "error": "Meet does not exist"}), 404

    return jsonify({"ok": True, "data": meet.to_dict(include_private=include_private)}), 200


@meet_bp.get("/get")
def list_all_meets():
    role = current_role()
    include_private = role is not None and role.edit_meet_scope == UserRole.ALL

    try:
        meets = Meet.list_all_meets()
        meets_data = []

        for m in meets:
            meets_data.append(m.to_dict(include_private=include_private))

        return jsonify({"ok": True, "data": meets_data}), 200

    except Error as e:
        return handle_error(e, "Database error")


@meet_bp.get("/get/<meet_number>/races")
def get_meet_races(meet_number):
    rows = fetch_all(
        """
        SELECT
            MeetNumber AS meetNumber,
            RaceNumber AS raceNumber,
            Program AS program,
            COUNT(*) AS entryCount
        FROM RaceResults
        WHERE MeetNumber = %s
        GROUP BY MeetNumber, Program, RaceNumber
        ORDER BY CAST(Program AS UNSIGNED), CAST(RaceNumber AS UNSIGNED)
        """,
        [meet_number],
    )

    return jsonify({
        "ok": True,
        "data": rows
    }), 200


@meet_bp.get("/search")
def search_meets():
    q = (request.args.get("q") or "").strip()
    owner = request.args.get("owner", None)

    try:
        rows = Meet.search(query=q, owner_person_id=owner)

        items = []
        for r in rows:
            d = dict(r)
            items.append({
                "id": d.get("MeetNumber"),
                "meetNumber": d.get("MeetNumber"),
                "clubAbbreviation": d.get("ClubAbbreviation"),
                "meetDate": d.get("MeetDate"),
                "raceSecretary": d.get("RaceSecretary"),
                "judge": d.get("Judge"),
                "location": d.get("Location"),
                "yards": d.get("Yards"),
                "publicNotes": d.get("PublicNotes"),
            })
        return jsonify({"ok": True, "total": len(items), "items": items}), 200

    except Error as e:
        return handle_error(e, "Database error")

@meet_bp.get("/<meet_number>/dogs.csv")
def download_dogs_csv(meet_number):
    try:
        data = Meet.get_dogs_for_meet(meet_number)
        if not data:
            return Response("", mimetype="text/csv")
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        response = Response(output.getvalue(), mimetype="text/csv")
        response.headers["Content-Disposition"] = f'attachment; filename="meet_{meet_number}_dogs.csv"'
        return response
    except Error as e:        
        return handle_error(e, "Database error")