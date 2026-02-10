from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from datetime import datetime, timezone
from classes.meet_result import MeetResult
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from utils.auth_helpers import current_editor_id, current_role, require_scope

meet_result_bp = Blueprint("meet_result", __name__, url_prefix="/api/meet_result")


@meet_result_bp.post("/add")
def register_meet_result():
    role = current_editor_id()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_meet_results_scope, "create meet results")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    meet_result = MeetResult.from_request_data(data)

    meet_result.last_edited_by = current_editor_id()
    meet_result.last_edited_at = datetime.now(timezone.utc)

    if role.edit_meet_results_scope == UserRole.SELF:
        return jsonify({"ok": False, "error": "Not allowed to create this meet result"}), 403

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

    if role.edit_meet_results_scope == UserRole.SELF:
        return jsonify({"ok": False, "error": "Not allowed to edit this meet result"}), 403

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

    if role.edit_meet_results_scope == UserRole.SELF:
        return jsonify({"ok": False, "error": "Not allowed to delete this meet result"}), 403

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

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@meet_result_bp.get("/get/<meet_number>/<cwa_number>")
def get_meet_result(meet_number: str, cwa_number: str):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_meet_results_scope, "view meet results")
    if deny:
        return deny

    meet_result = MeetResult.find_by_identifier(meet_number, cwa_number)
    if not meet_result:
        return jsonify({"ok": False, "error": "Meet result does not exist"}), 404

    if role.view_meet_results_scope == UserRole.SELF:
        return jsonify({"ok": False, "error": "Not allowed to view this meet result"}), 403

    return jsonify({"ok": True, "data": meet_result.to_dict()}), 200


@meet_result_bp.get("/get")
def list_all_meet_results():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_meet_results_scope, "view meet results")
    if deny:
        return deny

    try:
        meet_results = MeetResult.list_all_meet_results()
        out = []
        for mr in meet_results:
            if role.view_meet_results_scope == UserRole.SELF:
                continue
            out.append(mr.to_dict())

        return jsonify({"ok": True, "data": out}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500