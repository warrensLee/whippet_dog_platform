from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.person import Person

person_bp = Blueprint("person", __name__, url_prefix="/api/person")


@person_bp.post("/register")
def register_person():
    data = request.get_json(silent=True) or {}
    person = Person.from_request_data(data)

    validation_errors = person.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Person.exists(person.person_id):
        return jsonify({"ok": False, "error": "Person already exists"}), 409
    try:
        person.save()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@person_bp.post("/edit")
def edit_person():
    data = request.get_json(silent=True) or {}

    person_id = (data.get("personId") or "").strip()
    if not person_id:
        return jsonify({"ok": False, "error": "Person ID is required"}), 400

    person = Person.from_request_data(data)
    person.person_id = person_id
    validation_errors = person.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not Person.exists(person_id):
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    try:
        person.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@person_bp.post("/delete")
def delete_person():
    data = request.get_json(silent=True) or {}
    person_id = (data.get("personId") or "").strip()

    if not person_id:
        return jsonify({"ok": False, "error": "Person ID is required"}), 400

    if not Person.exists(person_id):
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    try:
        person = Person.find_by_identifier(person_id)
        if not person:
            return jsonify({"ok": False, "error": "Person does not exist"}), 404
        person.delete(person_id)
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@person_bp.get("/get/<person_id>")
def get_person(person_id: str):
    person = Person.find_by_identifier(person_id)
    if not person:
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    return jsonify(person.to_dict()), 200


@person_bp.get("/list")
def list_all_persons():
    try:
        persons = Person.list_all_persons()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    persons_data = [person.to_dict() for person in persons]
    return jsonify(persons_data), 200           