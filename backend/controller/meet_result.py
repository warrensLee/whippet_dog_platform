from flask import Blueprint, jsonify, request
from mysql.connector import Error
from datetime import datetime, timezone
from classes.meet_result import MeetResult
from classes.dog_owner import DogOwner
from classes.dog import Dog
from classes.dog_title import DogTitle
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from utils.auth_helpers import current_editor_id, current_role, require_scope

meet_result_bp = Blueprint("meet_result", __name__, url_prefix="/api/meet_result")

def _is_owner(cwa_number):
    pid = current_editor_id()
    return DogOwner.exists(cwa_number, pid) if pid else False


@meet_result_bp.post("/add")
def register_meet_result():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_results_scope, "create meet results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    meet_result = MeetResult.from_request_data(data)

    if role.edit_meet_results_scope == UserRole.SELF and not _is_owner(meet_result.cwa_number):
        return jsonify({"ok": False, "error": "You can only add meet results for dogs you own"}), 403

    meet_result.last_edited_by = current_editor_id()
    meet_result.last_edited_at = datetime.now(timezone.utc)

    validation_errors = meet_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if MeetResult.exists(meet_result.meet_number, meet_result.cwa_number):
        return jsonify({"ok": False, "error": "Meet result already exists"}), 409

    try:
        meet_result.save()

        ChangeLog.log(
            changed_table="MeetResult",
            record_pk=f"{meet_result.meet_number}|{meet_result.cwa_number}",
            operation="INSERT",
            changed_by=current_editor_id(),
            source="api/meet_result/add POST",
            before_obj=None,
            after_obj=meet_result.to_dict(),
        )

        dog = Dog.find_by_identifier(meet_result.cwa_number)
        if dog:
            dog.update_from_meet_results()
            DogTitle.sync_titles_for_dog(dog, current_editor_id(), datetime.now(timezone.utc))

        return jsonify({"ok": True}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@meet_result_bp.post("/edit")
def edit_meet_result():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_results_scope, "edit meet results")
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

    if role.edit_meet_results_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "You can only edit meet results for dogs you own"}), 403

    before_snapshot = existing.to_dict()

    meet_result = MeetResult.from_request_data(data)
    meet_result.meet_number = meet_number
    meet_result.cwa_number = cwa_number
    meet_result.last_edited_by = current_editor_id()
    meet_result.last_edited_at = datetime.now(timezone.utc)

    validation_errors = meet_result.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        meet_result.update()

        refreshed = MeetResult.find_by_identifier(meet_number, cwa_number)
        after_snapshot = refreshed.to_dict() if refreshed else meet_result.to_dict()

        ChangeLog.log(
            changed_table="MeetResult",
            record_pk=f"{meet_number}|{cwa_number}",
            operation="UPDATE",
            changed_by=current_editor_id(),
            source="api/meet_result/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        # Sync dog titles
        dog = Dog.find_by_identifier(cwa_number)
        if dog:
            dog.update_from_meet_results()
            DogTitle.sync_titles_for_dog(dog, current_editor_id(), datetime.now(timezone.utc))

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@meet_result_bp.post("/delete")
def delete_meet_result():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_results_scope, "delete meet results")
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

    if role.edit_meet_results_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "You can only delete meet results for dogs you own"}), 403

    try:
        before_snapshot = meet_result.to_dict()
        meet_result.delete(meet_number, cwa_number)

        ChangeLog.log(
            changed_table="MeetResult",
            record_pk=f"{meet_number}|{cwa_number}",
            operation="DELETE",
            changed_by=current_editor_id(),
            source="api/meet_result/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        # Sync dog titles
        dog = Dog.find_by_identifier(cwa_number)
        if dog:
            dog.update_from_meet_results()
            DogTitle.sync_titles_for_dog(dog, current_editor_id(), datetime.now(timezone.utc))

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


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
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500