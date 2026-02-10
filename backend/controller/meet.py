from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from datetime import datetime, timezone
from classes.meet import Meet
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from utils.auth_helpers import current_editor_id, current_role, require_scope



meet_bp = Blueprint("meet", __name__, url_prefix="/api/meet")


def _is_meet_owner(meet):
    person_id = current_editor_id()
    if not person_id or not meet:
        return False

    judge = getattr(meet, "judge", None) or getattr(meet, "Judge", None)
    race_secretary = (getattr(meet, "race_secretary", None) or getattr(meet, "raceSecretary", None) or getattr(meet, "RaceSecretary", None))

    return (judge) == (person_id) or (race_secretary) == (person_id)


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
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


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
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


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

        meet.delete(meet_number)

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
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@meet_bp.get("/get/<meet_number>")
def get_meet(meet_number):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_meet_scope, "view meets")
    if deny:
        return deny

    meet = Meet.find_by_identifier(meet_number)
    if not meet:
        return jsonify({"ok": False, "error": "Meet does not exist"}), 404

    if role.view_meet_scope == UserRole.SELF and not _is_meet_owner(meet):
        return jsonify({"ok": False, "error": "Not allowed to view this meet"}), 403

    return jsonify({"ok": True, "data": meet.to_dict()}), 200


@meet_bp.get("/get")
def list_all_meets():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_meet_scope, "view meets")
    if deny:
        return deny

    try:
        meets = Meet.list_all_meets()  
        meets_data = []

        for m in meets:
            if role.view_meet_scope == UserRole.SELF and not _is_meet_owner(m):
                continue
            meets_data.append(m.to_dict())

        return jsonify({"ok": True, "data": meets_data}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
