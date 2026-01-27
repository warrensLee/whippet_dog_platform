from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.dog_owner import DogOwner

dog_owner_bp = Blueprint("dog_owner", __name__, url_prefix="/api/dog_owner")


@dog_owner_bp.post("/register")
def register_dog_owner():
    data = request.get_json(silent=True) or {}
    dog_owner = DogOwner.from_request_data(data)

    validation_errors = dog_owner.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if DogOwner.exists(dog_owner.cwa_id, dog_owner.person_id):
        return jsonify({"ok": False, "error": "Dog owner already exists"}), 409

    try:
        dog_owner.save()
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

    dog_owner = DogOwner.from_request_data(data)
    dog_owner.cwa_id = cwa_id
    dog_owner.person_id = person_id

    validation_errors = dog_owner.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not DogOwner.exists(cwa_id, person_id):
        return jsonify({"ok": False, "error": "Dog owner does not exist"}), 404

    try:
        dog_owner.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@dog_owner_bp.post("/delete")
def delete_dog_owner():
    data = request.get_json(silent=True) or {}
    cwa_id = (data.get("cwaId") or "").strip()
    person_id = (data.get("personId") or "").strip()

    if not cwa_id:
        return jsonify({"ok": False, "error": "CWA ID is required"}), 400
    if not person_id:
        return jsonify({"ok": False, "error": "Person ID is required"}), 400        

    if not DogOwner.exists(cwa_id, person_id):
        return jsonify({"ok": False, "error": "Dog owner does not exist"}), 404

    try:
        dog_owner = DogOwner.find_by_identifier(cwa_id, person_id)
        if not dog_owner:
            return jsonify({"ok": False, "error": "Dog owner does not exist"}), 404
        dog_owner.delete(cwa_id, person_id)
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