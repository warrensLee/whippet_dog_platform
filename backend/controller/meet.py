from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from classes.meet import Meet
from classes.change_log import ChangeLog
from datetime import datetime

meet_bp = Blueprint("meet", __name__, url_prefix="/api/meet")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    return (u.get("PersonID") or u.get("personId") or u.get("id") or None)

@meet_bp.post("/register")
def register_meet():
    data = request.get_json(silent=True) or {}
    meet = Meet.from_request_data(data)

    meet.last_edited_by = _current_editor_id()
    meet.last_edited_at = datetime.utcnow()

    validation_errors = meet.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Meet.exists(meet.meet_number):
        return jsonify({"ok": False, "error": "Meet already exists"}), 409
    
    try:
        meet.save()
        
        ChangeLog.log(
            changed_table="Meet",
            record_pk=meet.meet_number,
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/meet/register POST",
            before_obj=None,
            after_obj=meet.to_dict(),
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@meet_bp.post("/edit")
def edit_meet():
    data = request.get_json(silent=True) or {}

    meet_number = (data.get("meetNumber") or "").strip()
    if not meet_number:
        return jsonify({"ok": False, "error": "Meet number is required"}), 400

    existing = Meet.find_by_identifier(meet_number)
    if not existing:
        return jsonify({"ok": False, "error": "Meet does not exist"}), 404
    
    before_snapshot = existing.to_dict()
    meet = Meet.from_request_data(data)
    meet.meet_number = meet_number

    meet.last_edited_by = _current_editor_id()
    meet.last_edited_at = datetime.utcnow()

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
            changed_by=_current_editor_id(),
            source="api/meet/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@meet_bp.post("/delete")
def delete_meet():
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
        
        before_snapshot = meet.to_dict()
        meet.delete(meet_number)
        
        ChangeLog.log(
            changed_table="Meet",
            record_pk=meet_number,
            operation="DELETE",
            changed_by=_current_editor_id(),
            source="api/meet/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@meet_bp.get("/get/<meet_number>")
def get_meet(meet_number: str):
    meet = Meet.find_by_identifier(meet_number)
    if not meet:
        return jsonify({"ok": False, "error": "Meet does not exist"}), 404
    return jsonify(meet.to_dict()), 200


@meet_bp.get("/list")
def list_all_meets():
    try:
        meets = Meet.list_all_meets()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    meets_data = [meet.to_dict() for meet in meets]
    return jsonify(meets_data), 200           
