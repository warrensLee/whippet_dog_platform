from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from classes.dog_title import DogTitle
from classes.change_log import ChangeLog
from datetime import datetime

dog_title_bp = Blueprint("dog_title", __name__, url_prefix="/api/dog_title")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    return (u.get("PersonID") or u.get("personId") or u.get("id") or None)

@dog_title_bp.post("/register")
def register_dog_title():
    data = request.get_json(silent=True) or {}
    dog_title = DogTitle.from_request_data(data)

    dog_title.last_edited_by = _current_editor_id()
    dog_title.last_edited_at = datetime.utcnow()

    validation_errors = dog_title.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if DogTitle.exists(dog_title.cwa_number, dog_title.title):
        return jsonify({"ok": False, "error": "Dog title already exists"}), 409
    
    try:
        dog_title.save()
        
        ChangeLog.log(
            changed_table="DogTitle",
            record_pk=f"{dog_title.cwa_number}|{dog_title.title}",
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/dog_title/register POST",
            before_obj=None,
            after_obj=dog_title.to_dict(),
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@dog_title_bp.post("/edit")
def edit_dog_title():
    data = request.get_json(silent=True) or {}
    cwa_number = (data.get("cwaNumber") or "").strip()
    title = (data.get("title") or "").strip()
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400
    if not title:
        return jsonify({"ok": False, "error": "Title is required"}), 400

    existing = DogTitle.find_by_identifier(cwa_number, title)
    if not existing:
        return jsonify({"ok": False, "error": "Dog title does not exist"}), 404
    
    before_snapshot = existing.to_dict()
    dog_title = DogTitle.from_request_data(data)
    dog_title.cwa_number = cwa_number
    dog_title.title = title

    dog_title.last_edited_by = _current_editor_id()
    dog_title.last_edited_at = datetime.utcnow()

    validation_errors = dog_title.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        dog_title.update()
        refreshed = DogTitle.find_by_identifier(cwa_number, title)
        after_snapshot = refreshed.to_dict() if refreshed else dog_title.to_dict()
        
        ChangeLog.log(
            changed_table="DogTitle",
            record_pk=f"{cwa_number}|{title}",
            operation="UPDATE",
            changed_by= _current_editor_id(),
            source="api/dog_title/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@dog_title_bp.post("/delete")
def delete_dog_title():
    data = request.get_json(silent=True) or {}
    cwa_number = (data.get("cwaNumber") or "").strip()
    title = (data.get("title") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400
    if not title:
        return jsonify({"ok": False, "error": "Title is required"}), 400

    try:
        dog_title = DogTitle.find_by_identifier(cwa_number, title)
        if not dog_title:
            return jsonify({"ok": False, "error": "Dog title does not exist"}), 404
        
        before_snapshot = dog_title.to_dict()
        dog_title.delete(cwa_number, title)
        
        ChangeLog.log(
            changed_table="DogTitle",
            record_pk=f"{cwa_number}|{title}",
            operation="DELETE",
            changed_by= _current_editor_id(),
            source="api/dog_title/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@dog_title_bp.get("/get/<cwa_number>/<title>")
def get_dog_title(cwa_number: str, title: str):
    dog_title = DogTitle.find_by_identifier(cwa_number, title)

    if not dog_title:
        return jsonify({"ok": False, "error": "Dog title does not exist"}), 404

    return jsonify(dog_title.to_dict()), 200


@dog_title_bp.get("/list")
def list_all_dog_titles():
    try:
        dog_titles = DogTitle.list_all_dog_titles()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    dog_titles_data = [dog_title.to_dict() for dog_title in dog_titles]
    return jsonify(dog_titles_data), 200  
