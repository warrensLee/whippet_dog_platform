from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.user_role import UserRole

user_role_bp = Blueprint("user_role", __name__, url_prefix="/api/user_role")


@user_role_bp.post("/register")
def register_user_role():
    data = request.get_json(silent=True) or {}
    user_role = UserRole.from_request_data(data)

    validation_errors = user_role.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if UserRole.exists(user_role.role_id):
        return jsonify({"ok": False, "error": "User role already exists"}), 409
    try:
        user_role.save()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@user_role_bp.post("/edit")
def edit_user_role():
    data = request.get_json(silent=True) or {}

    role_id = (data.get("roleId") or "").strip()
    if not role_id:
        return jsonify({"ok": False, "error": "Role ID is required"}), 400

    user_role = UserRole.from_request_data(data)
    user_role.role_id = role_id
    validation_errors = user_role.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not UserRole.exists(role_id):
        return jsonify({"ok": False, "error": "User role does not exist"}), 404

    try:
        user_role.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@user_role_bp.post("/delete")
def delete_user_role():
    data = request.get_json(silent=True) or {}
    role_id = (data.get("roleId") or "").strip()

    if not role_id:
        return jsonify({"ok": False, "error": "Role ID is required"}), 400

    if not UserRole.exists(role_id):
        return jsonify({"ok": False, "error": "User role does not exist"}), 404

    try:
        user_role = UserRole.find_by_identifier(role_id)
        if not user_role:
            return jsonify({"ok": False, "error": "User role does not exist"}), 404
        user_role.delete(role_id)
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@user_role_bp.get("/get/<role_id>")
def get_user_role(role_id: str):
    user_role = UserRole.find_by_identifier(role_id)
    if not user_role:
        return jsonify({"ok": False, "error": "User role does not exist"}), 404

    return jsonify(user_role.to_dict()), 200


@user_role_bp.get("/list")
def list_all_user_roles():
    try:
        user_roles = UserRole.list_all_user_roles()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    user_roles_data = [user_role.to_dict() for user_role in user_roles]
    return jsonify(user_roles_data), 200           