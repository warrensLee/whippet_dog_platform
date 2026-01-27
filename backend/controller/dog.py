from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.dog import Dog

dog_bp = Blueprint("dog", __name__, url_prefix="/api/dog")

@dog_bp.post("/register")
def register_dog():
    data = request.get_json(silent=True) or {}
    dog = Dog.from_request_data(data)
    
    validation_errors = dog.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Dog.exists(dog.cwa_number):
        return jsonify({"ok": False, "error": "Dog already exists"}), 409

    try:
        dog.save()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201

@dog_bp.post("/edit")
def edit_dog():
    data = request.get_json(silent=True) or {}
    
    cwa_number = (data.get("cwa_number") or "").strip()
    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400
    
    dog = Dog.from_request_data(data)
    dog.cwa_number = cwa_number
    
    validation_errors = dog.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not Dog.exists(cwa_number):
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    try:
        dog.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200

@dog_bp.post("/delete")
def delete_dog():
    data = request.get_json(silent=True) or {}
    cwa_number = (data.get("cwa_number") or "").strip()

    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400

    if not Dog.exists(cwa_number):
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    try:
        dog = Dog.find_by_identifier(cwa_number)
        if not dog:
            return jsonify({"ok": False, "error": "Dog does not exist"}), 404
        Dog.delete()
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