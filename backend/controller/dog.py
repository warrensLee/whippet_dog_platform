from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from classes.dog import Dog
from classes.change_log import ChangeLog
from datetime import datetime

dog_bp = Blueprint("dog", __name__, url_prefix="/api/dog")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    return (u.get("PersonID") or u.get("personId") or u.get("id") or None)

@dog_bp.post("/register")
def register_dog():
    data = request.get_json(silent=True) or {}
    dog = Dog.from_request_data(data)
    
    dog.last_edited_by = _current_editor_id()
    dog.last_edited_at = datetime.utcnow()

    validation_errors = dog.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Dog.exists(dog.cwa_number):
        return jsonify({"ok": False, "error": "Dog already exists"}), 409

    try:
        dog.save()
        
        ChangeLog.log(
            changed_table="Dog",
            record_pk=dog.cwa_number,
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/dog/register POST",
            before_obj=None,
            after_obj=dog.to_dict(),
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201

@dog_bp.post("/edit")
def edit_dog():
    data = request.get_json(silent=True) or {}
    cwa_number = (data.get("cwa_number") or "").strip()

    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400
    
    existing = Dog.find_by_identifier(cwa_number)
    if not existing:
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404
    
    before_snapshot = existing.to_dict()
    dog = Dog.from_request_data(data)
    dog.cwa_number = cwa_number

    dog.last_edited_by = _current_editor_id()
    dog.last_edited_at = datetime.utcnow()
    
    validation_errors = dog.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        dog.update()
        refreshed_dog = Dog.find_by_identifier(cwa_number)
        after_snapshot = refreshed_dog.to_dict() if refreshed_dog else None
        
        ChangeLog.log(
            changed_table="Dog",
            record_pk=cwa_number,
            operation="UPDATE",
            changed_by=_current_editor_id(),
            source="api/dog/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200

@dog_bp.post("/delete")
def delete_dog():
    data = request.get_json(silent=True) or {}
    cwa_number = (data.get("cwa_number") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400

    try:
        dog = Dog.find_by_identifier(cwa_number)
        if not dog:
            return jsonify({"ok": False, "error": "Dog does not exist"}), 404
        
        before_snapshot = dog.to_dict()
        Dog.delete(cwa_number)
        
        ChangeLog.log(
            changed_table="Dog",
            record_pk=cwa_number,
            operation="DELETE",
            changed_by=_current_editor_id(),
            source="api/dog/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200

@dog_bp.get("/get/<cwa_number>")
def get_dog(cwa_number):
    dog = Dog.find_by_identifier(cwa_number)
    
    if not dog:
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    return jsonify(dog.to_dict()), 200

@dog_bp.get("/list")
def list_all_dogs():
    try:
        dogs = Dog.list_all_dogs()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    dogs_data = [dog.to_dict() for dog in dogs]
    return jsonify(dogs_data), 200

@dog_bp.get("/titles/<cwa_number>")
def list_dog_titles(cwa_number):
    dog = Dog.find_by_identifier(cwa_number)
    try:
        dog_titles = dog.check_titles()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify(dog_titles), 200
