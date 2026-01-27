from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.title_type import TitleType

title_type_bp = Blueprint("title_type", __name__, url_prefix="/api/title_type")


@title_type_bp.post("/register")
def register_title_type():
    data = request.get_json(silent=True) or {}
    title_type = TitleType.from_request_data(data)

    validation_errors = title_type.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if TitleType.exists(title_type.title_type_id):
        return jsonify({"ok": False, "error": "Title type already exists"}), 409
    try:
        title_type.save()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@title_type_bp.post("/edit")
def edit_title_type():
    data = request.get_json(silent=True) or {}

    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"ok": False, "error": "Title is required"}), 400

    title_type = TitleType.from_request_data(data)
    title_type.title = title
    validation_errors = title_type.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not TitleType.exists(title_type.title):
        return jsonify({"ok": False, "error": "Title type does not exist"}), 404

    try:
        title_type.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@title_type_bp.post("/delete")
def delete_title_type():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"ok": False, "error": "Title is required"}), 400

    if not TitleType.exists(title):
        return jsonify({"ok": False, "error": "Title type does not exist"}), 404

    try:
        title_type = TitleType.find_by_identifier(title)
        if not title_type:
            return jsonify({"ok": False, "error": "Title type does not exist"}), 404
        title_type.delete(title)
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