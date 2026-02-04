from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from classes.title_type import TitleType
from classes.change_log import ChangeLog
from datetime import datetime

title_type_bp = Blueprint("title_type", __name__, url_prefix="/api/title_type")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    return (u.get("PersonID") or u.get("personId") or u.get("id") or None)

@title_type_bp.post("/register")
def register_title_type():
    data = request.get_json(silent=True) or {}
    title_type = TitleType.from_request_data(data)

    title_type.last_edited_by = _current_editor_id()
    title_type.last_edited_at = datetime.utcnow()

    validation_errors = title_type.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if TitleType.exists(title_type.title):
        return jsonify({"ok": False, "error": "Title type already exists"}), 409
    try:
        title_type.save()

        ChangeLog.log(
            changed_table="TitleType",
            record_pk=title_type.title,
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/title_type/register POST",
            before_obj=None,
            after_obj=title_type.to_dict(),
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@title_type_bp.post("/edit")
def edit_title_type():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"ok": False, "error": "Title is required"}), 400

    existing = TitleType.find_by_identifier(title)
    if not existing:
        return jsonify({"ok": False, "error": "Title type does not exist"}), 404
    
    before_snapshot = existing.to_dict()
    title_type = TitleType.from_request_data(data)
    title_type.title = title

    title_type.last_edited_by = _current_editor_id()
    title_type.last_edited_at = datetime.utcnow()

    validation_errors = title_type.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        title_type.update()
        refreshed = TitleType.find_by_identifier(title)
        after_snapshot = refreshed.to_dict() if refreshed else title_type.to_dict()
        
        ChangeLog.log(
            changed_table="TitleType",
            record_pk=title,
            operation="UPDATE",
            changed_by=_current_editor_id(),
            source="api/title_type/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@title_type_bp.post("/delete")
def delete_title_type():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not title:
        return jsonify({"ok": False, "error": "Title is required"}), 400

    try:
        title_type = TitleType.find_by_identifier(title)
        if not title_type:
            return jsonify({"ok": False, "error": "Title type does not exist"}), 404
        
        before_snapshot = title_type.to_dict()
        title_type.delete(title)

        ChangeLog.log(
            changed_table="TitleType",
            record_pk=title,
            operation="DELETE",
            changed_by=_current_editor_id(),
            source="api/title_type/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@title_type_bp.get("/get/<title>")
def get_title_type(title: str):
    title_type = TitleType.find_by_identifier(title)
    if not title_type:
        return jsonify({"ok": False, "error": "Title type does not exist"}), 404

    return jsonify(title_type.to_dict()), 200


@title_type_bp.get("/list")
def list_all_title_types():
    try:
        title_types = TitleType.list_all_title_types()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    title_types_data = [title_type.to_dict() for title_type in title_types]
    return jsonify(title_types_data), 200           
