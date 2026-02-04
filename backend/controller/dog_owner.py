from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from classes.dog_owner import DogOwner
from classes.change_log import ChangeLog
from datetime import datetime

dog_owner_bp = Blueprint("dog_owner", __name__, url_prefix="/api/dog_owner")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    return (u.get("PersonID") or u.get("personId") or u.get("id") or None)

@dog_owner_bp.post("/register")
def register_dog_owner():
    data = request.get_json(silent=True) or {}
    dog_owner = DogOwner.from_request_data(data)

    dog_owner.last_edited_by = _current_editor_id()
    dog_owner.last_edited_at = datetime.utcnow()

    validation_errors = dog_owner.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if DogOwner.exists(dog_owner.cwa_id, dog_owner.person_id):
        return jsonify({"ok": False, "error": "Dog owner already exists"}), 409

    try:
        dog_owner.save()
        
        ChangeLog.log(
            changed_table="DogOwner",
            record_pk=f"{dog_owner.cwa_id}|{dog_owner.person_id}",
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/dog_owner/register POST",
            before_obj=None,
            after_obj=dog_owner.to_dict(),
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@dog_owner_bp.post("/edit")
def edit_dog_owner():
    data = request.get_json(silent=True) or {}
    cwa_id = (data.get("cwaId") or "").strip()
    person_id = (data.get("personId") or "").strip()
    
    if not cwa_id:
        return jsonify({"ok": False, "error": "CWA ID is required"}), 400
    if not person_id:
        return jsonify({"ok": False, "error": "Person ID is required"}), 400

    existing = DogOwner.find_by_identifier(cwa_id, person_id)
    if not existing:
        return jsonify({"ok": False, "error": "Dog owner does not exist"}), 404
    
    before_snapshot = existing.to_dict()
    dog_owner = DogOwner.from_request_data(data)
    dog_owner.cwa_id = cwa_id
    dog_owner.person_id = person_id

    dog_owner.last_edited_by = _current_editor_id()
    dog_owner.last_edited_at = datetime.utcnow()

    validation_errors = dog_owner.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        dog_owner.update()
        refreshed = DogOwner.find_by_identifier(cwa_id, person_id)
        after_snapshot = refreshed.to_dict() if refreshed else dog_owner.to_dict()

        ChangeLog.log(
            changed_table="DogOwner",
            record_pk=f"{cwa_id}|{person_id}",
            operation="UPDATE",
            changed_by=_current_editor_id(),
            source="api/dog_owner/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@dog_owner_bp.post("/delete")
def delete_dog_owner():
    data = request.get_json(silent=True) or {}
    cwa_id = (data.get("cwaId") or "").strip()
    person_id = (data.get("personId") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not cwa_id:
        return jsonify({"ok": False, "error": "CWA ID is required"}), 400
    if not person_id:
        return jsonify({"ok": False, "error": "Person ID is required"}), 400        

    try:
        dog_owner = DogOwner.find_by_identifier(cwa_id, person_id)
        if not dog_owner:
            return jsonify({"ok": False, "error": "Dog owner does not exist"}), 404
        
        before_snapshot = dog_owner.to_dict()
        dog_owner.delete(cwa_id, person_id)
        
        ChangeLog.log(
            changed_table="DogOwner",
            record_pk=f"{cwa_id}|{person_id}",
            operation="DELETE",
            changed_by=_current_editor_id(),
            source="api/dog_owner/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@dog_owner_bp.get("/get/<cwa_id>/<person_id>")
def get_dog_owner(cwa_id: str, person_id: str):
    dog_owner = DogOwner.find_by_identifier(cwa_id, person_id)
    if not dog_owner:
        return jsonify({"ok": False, "error": "Dog owner does not exist"}), 404

    return jsonify(dog_owner.to_dict()), 200


@dog_owner_bp.get("/list")
def list_all_dog_owners():
    try:
        dog_owners = DogOwner.list_all_dog_owners()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    dog_owners_data = [dog_owner.to_dict() for dog_owner in dog_owners]
    return jsonify(dog_owners_data), 200  
