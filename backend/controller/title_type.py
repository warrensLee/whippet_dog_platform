from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from datetime import datetime, timezone
from classes.title_type import TitleType
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from utils.auth_helpers import current_editor_id, current_role, require_scope


title_type_bp = Blueprint("title_type", __name__, url_prefix="/api/title_type")

@title_type_bp.post("/add")
def add_title_type():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_title_type_scope, "edit title types")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    title_type = TitleType.from_request_data(data)

    title_type.last_edited_by = current_editor_id()
    title_type.last_edited_at = datetime.now(timezone.utc)

    errors = title_type.validate()
    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    if TitleType.exists(title_type.title):
        return jsonify({"ok": False, "error": "Title type already exists"}), 409

    try:
        title_type.save()

        ChangeLog.log(
            changed_table="TitleType",
            record_pk=title_type.title,
            operation="INSERT",
            changed_by=current_editor_id(),
            source="api/title_type/add POST",
            before_obj=None,
            after_obj=title_type.to_dict(),
        )

        return jsonify({"ok": True, "data": title_type.to_dict()}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@title_type_bp.post("/edit")
def edit_title_type():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_title_type_scope, "edit title types")
    if deny:
        return deny

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
    title_type.last_edited_by = current_editor_id()
    title_type.last_edited_at = datetime.now(timezone.utc)

    errors = title_type.validate()
    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    try:
        title_type.update()

        refreshed = TitleType.find_by_identifier(title)
        after_snapshot = refreshed.to_dict() if refreshed else title_type.to_dict()

        ChangeLog.log(
            changed_table="TitleType",
            record_pk=title,
            operation="UPDATE",
            changed_by=current_editor_id(),
            source="api/title_type/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        return jsonify({"ok": True, "data": after_snapshot}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@title_type_bp.post("/delete")
def delete_title_type():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_title_type_scope, "edit title types")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not title:
        return jsonify({"ok": False, "error": "Title is required"}), 400

    try:
        existing = TitleType.find_by_identifier(title)
        if not existing:
            return jsonify({"ok": False, "error": "Title type does not exist"}), 404

        before_snapshot = existing.to_dict()
        existing.delete(title)

        ChangeLog.log(
            changed_table="TitleType",
            record_pk=title,
            operation="DELETE",
            changed_by=current_editor_id(),
            source="api/title_type/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"ok": True, "data": {"title": title}}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

@title_type_bp.get("/get/<title>")
def get_title_type(title: str):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_title_type_scope, "view title types")
    if deny:
        return deny

    title_type = TitleType.find_by_identifier(title)
    if not title_type:
        return jsonify({"ok": False, "error": "Title type does not exist"}), 404

    return jsonify({"ok": True, "data": title_type.to_dict()}), 200


@title_type_bp.get("/get")
def get_all_title_types():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_title_type_scope, "view title types")
    if deny:
        return deny

    try:
        title_types = TitleType.list_all_title_types()
        data = [t.to_dict() for t in title_types]
        return jsonify({"ok": True, "data": data}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
