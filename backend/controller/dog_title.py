from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.dog_title import DogTitle

dog_title_bp = Blueprint("dog_title", __name__, url_prefix="/api/dog_title")


@dog_title_bp.post("/register")
def register_dog_title():
    data = request.get_json(silent=True) or {}
    dog_title = DogTitle.from_request_data(data)

    validation_errors = dog_title.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if DogTitle.exists(dog_title.cwa_number, dog_title.title):
        return jsonify({"ok": False, "error": "Dog title already exists"}), 409
    try:
        dog_title.save()
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

    dog_title = DogTitle.from_request_data(data)
    dog_title.cwa_number = cwa_number
    dog_title.title = title

    validation_errors = dog_title.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not DogTitle.exists(cwa_number, title):
        return jsonify({"ok": False, "error": "Dog title does not exist"}), 404

    try:
        dog_title.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@dog_title_bp.post("/delete")
def delete_dog_title():
    data = request.get_json(silent=True) or {}
    cwa_number = (data.get("cwaNumber") or "").strip()
    title = (data.get("title") or "").strip()

    if not cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400
    if not title:
        return jsonify({"ok": False, "error": "Title is required"}), 400

    if not DogTitle.exists(cwa_number, title):
        return jsonify({"ok": False, "error": "Dog title does not exist"}), 404

    try:
        dog_title = DogTitle.find_by_identifier(cwa_number, title)
        if not dog_title:
            return jsonify({"ok": False, "error": "Dog title does not exist"}), 404
        dog_title.delete(cwa_number, title)
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