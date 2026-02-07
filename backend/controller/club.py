from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from datetime import datetime, timezone
from classes.club import Club
from classes.change_log import ChangeLog
from classes.user_role import UserRole

club_bp = Blueprint("club", __name__, url_prefix="/api/club")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    return (u.get("PersonID") or u.get("personId") or u.get("id") or None)

def _current_role() -> UserRole | None:
    u = session.get("user") or {}
    pid = u.get("PersonID")
    if not pid:
        return None

    title = u.get("SystemRole")
    if not title:
        return None

    return UserRole.find_by_title(title.strip().upper())

def _require_scope(scope_value: int, action: str):
    if scope_value == UserRole.NONE:
        return jsonify({"ok": False, "error": f"Not allowed to {action}"}), 403
    return None


def _is_member(club_abbreviation: str) -> bool:
    pid = _current_editor_id()
    if not pid:
        return False

    club = Club.find_by_identifier(club_abbreviation)
    if not club:
        return False

    return (
        pid == club.board_member1
        or pid == club.board_member2
        or pid == club.default_race_secretary
    )


@club_bp.post("/add")
def register_club():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_club_scope, "create clubs")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    club = Club.from_request_data(data)

    if role.edit_club_scope == UserRole.SELF:
        pid = _current_editor_id()
        if not pid:
            return jsonify({"ok": False, "error": "Not signed in"}), 401

    if not (club.board_member1 == pid or club.board_member2 == pid or club.default_race_secretary == pid):
        return jsonify({"ok": False, "error": "Not allowed to create a club unless you are a board member or race secretary"}), 403

    club.last_edited_by = _current_editor_id()
    club.last_edited_at = datetime.now(timezone.utc)

    validation_errors = club.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Club.exists(club.club_abbreviation):
        return jsonify({"ok": False, "error": "Club already exists"}), 409

    try:
        club.save()

        ChangeLog.log(
            changed_table="Club",
            record_pk=club.club_abbreviation,
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/club/register POST",
            before_obj=None,
            after_obj=club.to_dict(),
        )

        return jsonify({"ok": True}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@club_bp.post("/edit")
def edit_club():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_club_scope, "edit clubs")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    club_abbreviation = (data.get("clubAbbreviation") or "").strip()

    if not club_abbreviation:
        return jsonify({"ok": False, "error": "Club abbreviation is required"}), 400

    existing = Club.find_by_identifier(club_abbreviation)
    if not existing:
        return jsonify({"ok": False, "error": "Club does not exist"}), 404

    if role.edit_club_scope == UserRole.SELF and not _is_member(club_abbreviation):
        return jsonify({"ok": False, "error": "Not allowed to edit this club"}), 403

    before_snapshot = existing.to_dict()

    club = Club.from_request_data(data)
    club.club_abbreviation = club_abbreviation

    club.last_edited_by = _current_editor_id()
    club.last_edited_at = datetime.now(timezone.utc)

    validation_errors = club.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        club.update()

        refreshed = Club.find_by_identifier(club_abbreviation)
        after_snapshot = refreshed.to_dict() if refreshed else club.to_dict()

        ChangeLog.log(
            changed_table="Club",
            record_pk=club_abbreviation,
            operation="UPDATE",
            changed_by=_current_editor_id(),
            source="api/club/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@club_bp.post("/delete")
def delete_club():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_club_scope, "delete clubs")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    club_abbreviation = (data.get("clubAbbreviation") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not club_abbreviation:
        return jsonify({"ok": False, "error": "Club abbreviation is required"}), 400

    club = Club.find_by_identifier(club_abbreviation)
    if not club:
        return jsonify({"ok": False, "error": "Club does not exist"}), 404

    if role.edit_club_scope == UserRole.SELF and not _is_member(club_abbreviation):
        return jsonify({"ok": False, "error": "Not allowed to delete this club"}), 403

    try:
        before_snapshot = club.to_dict()

        club.delete(club_abbreviation)

        ChangeLog.log(
            changed_table="Club",
            record_pk=club_abbreviation,
            operation="DELETE",
            changed_by=_current_editor_id(),
            source="api/club/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@club_bp.get("/get/<club_abbreviation>")
def get_club(club_abbreviation: str):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_club_scope, "view clubs")
    if deny:
        return deny

    club = Club.find_by_identifier(club_abbreviation)
    if not club:
        return jsonify({"ok": False, "error": "Club does not exist"}), 404

    if role.view_club_scope == UserRole.SELF and not _is_member(club_abbreviation):
        return jsonify({"ok": False, "error": "Not allowed to view this club"}), 403

    return jsonify({"ok": True, "data": club.to_dict()}), 200


@club_bp.get("/get")
def list_all_clubs():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_club_scope, "view clubs")
    if deny:
        return deny

    try:
        if role.view_club_scope == UserRole.ALL:
            clubs = Club.list_all_clubs()
        else:
            pid = _current_editor_id()
            if not pid:
                return jsonify({"ok": False, "error": "Not signed in"}), 401
            clubs = Club.list_clubs_for_member(pid)

        return jsonify({"ok": True, "data": [c.to_dict() for c in clubs]}), 200

    except AttributeError as e:
        return jsonify({"ok": False, "error": f"Missing method: {str(e)}"}), 500
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@club_bp.get("/board")
def list_board():
    try:
        roster = Club.list_board_roster()
        return jsonify({"ok": True, "data": roster}), 200
    except AttributeError:
        return jsonify({"ok": False, "error": "Club.list_board_roster() is not implemented yet"}), 500
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
