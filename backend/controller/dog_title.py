from flask import Blueprint, jsonify, request
from mysql.connector import Error
from datetime import datetime, timezone
from classes.dog_title import DogTitle
from classes.dog_owner import DogOwner
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from database import fetch_one
from utils.auth_helpers import current_editor_id, current_role, require_scope


dog_title_bp = Blueprint("dog_title", __name__, url_prefix="/api/dog_title")


def _is_owner(cwa_number):
    """Check if current user owns the specified dog."""
    pid = current_editor_id()
    if not pid:
        return False
    return DogOwner.exists(cwa_number, pid)


@dog_title_bp.post("/add")
def add_dog_title():
    """Add a new title to a dog."""
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_dog_titles_scope, "add dog titles")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    dog_title = DogTitle.from_request_data(data)

    if role.edit_dog_titles_scope == UserRole.SELF:
        if not _is_owner(dog_title.cwa_number):
            return jsonify({
                "ok": False,
                "error": "You can only add titles to dogs you own"
            }), 403

    dog_title.last_edited_by = current_editor_id()
    dog_title.last_edited_at = datetime.now(timezone.utc)

    errors = dog_title.validate()
    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    if not fetch_one("SELECT 1 FROM Dog WHERE CWANumber = %s LIMIT 1", (dog_title.cwa_number,)):
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    if not fetch_one("SELECT 1 FROM TitleType WHERE Title = %s LIMIT 1", (dog_title.title,)):
        return jsonify({"ok": False, "error": "Title type does not exist"}), 404

    if DogTitle.exists(dog_title.cwa_number, dog_title.title):
        return jsonify({"ok": False, "error": "Dog already has this title"}), 409

    try:
        dog_title.save()

        ChangeLog.log(
            changed_table="DogTitle",
            record_pk=f"{dog_title.cwa_number}|{dog_title.title}",
            operation="INSERT",
            changed_by=current_editor_id(),
            source="api/dog_title/add POST",
            before_obj=None,
            after_obj=dog_title.to_dict(),
        )

        return jsonify({"ok": True, "data": dog_title.to_dict()}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_title_bp.post("/edit")
def edit_dog_title():
    """Edit an existing dog title."""
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_dog_titles_scope, "edit dog titles")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    cwa_number = (data.get("cwaNumber") or "").strip()
    title = (data.get("title") or "").strip()

    if not cwa_number:
        return jsonify({"ok": False, "error": "cwaNumber is required"}), 400
    if not title:
        return jsonify({"ok": False, "error": "title is required"}), 400

    if role.edit_dog_titles_scope == UserRole.SELF:
        if not _is_owner(cwa_number):
            return jsonify({
                "ok": False,
                "error": "You can only edit titles on dogs you own"
            }), 403

    if not fetch_one("SELECT 1 FROM Dog WHERE CWANumber = %s LIMIT 1", (cwa_number,)):
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    if not fetch_one("SELECT 1 FROM TitleType WHERE Title = %s LIMIT 1", (title,)):
        return jsonify({"ok": False, "error": "Title type does not exist"}), 404

    existing = DogTitle.find_by_identifier(cwa_number, title)
    if not existing:
        return jsonify({"ok": False, "error": "Dog title does not exist"}), 404

    before_snapshot = existing.to_dict()

    dog_title = DogTitle.from_request_data(data)
    dog_title.cwa_number = cwa_number
    dog_title.title = title
    dog_title.last_edited_by = current_editor_id()
    dog_title.last_edited_at = datetime.now(timezone.utc)

    errors = dog_title.validate()
    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    try:
        dog_title.update()
        refreshed = DogTitle.find_by_identifier(cwa_number, title)
        after_snapshot = refreshed.to_dict() if refreshed else dog_title.to_dict()

        ChangeLog.log(
            changed_table="DogTitle",
            record_pk=f"{cwa_number}|{title}",
            operation="UPDATE",
            changed_by=current_editor_id(),
            source="api/dog_title/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        return jsonify({"ok": True, "data": after_snapshot}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_title_bp.post("/delete")
def delete_dog_title():
    """Delete a dog title."""
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_dog_titles_scope, "delete dog titles")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    cwa_number = (data.get("cwaNumber") or "").strip()
    title = (data.get("title") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not cwa_number:
        return jsonify({"ok": False, "error": "cwaNumber is required"}), 400
    if not title:
        return jsonify({"ok": False, "error": "title is required"}), 400

    if role.edit_dog_titles_scope == UserRole.SELF:
        if not _is_owner(cwa_number):
            return jsonify({
                "ok": False,
                "error": "You can only delete titles on dogs you own"
            }), 403

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
            changed_by=current_editor_id(),
            source="api/dog_title/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"ok": True, "data": {"cwaNumber": cwa_number, "title": title}}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_title_bp.get("/get/<cwa_number>/<title>")
def get_dog_title(cwa_number, title):
    """Get a specific dog title."""
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_titles_scope, "view dog titles")
    # if deny:
    #     return deny

    # if role.view_dog_titles_scope == UserRole.SELF:
    #     if not _is_owner(cwa_number):
    #         return jsonify({
    #             "ok": False,
    #             "error": "You can only view titles on dogs you own"
    #         }), 403

    dog_title = DogTitle.find_by_identifier(cwa_number, title)
    if not dog_title:
        return jsonify({"ok": False, "error": "Dog title does not exist"}), 404

    return jsonify({"ok": True, "data": dog_title.to_dict()}), 200


@dog_title_bp.get("/get")
def get_all_dog_titles():
    """Get all dog titles."""
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_titles_scope, "view dog titles")
    # if deny:
    #     return deny

    try:
        # if role.view_dog_titles_scope == UserRole.ALL:
        titles = DogTitle.list_all_dog_titles()
        data = [t.to_dict() for t in titles]
        return jsonify({"ok": True, "data": data}), 200
        
        # elif role.view_dog_titles_scope == UserRole.SELF:
        #     pid = current_editor_id()
        #     if not pid:
        #         return jsonify({"ok": False, "error": "Not signed in"}), 401
            
        #     titles = DogTitle.list_titles_for_owner(pid)
        #     data = [t.to_dict() for t in titles]
        #     return jsonify({"ok": True, "data": data}), 200
        
        # else:
        #     return jsonify({"ok": False, "error": "Not allowed to view dog titles"}), 403
            
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500