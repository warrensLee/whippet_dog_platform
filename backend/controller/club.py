from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.club import Club
from classes.person import Person
from classes.change_log import ChangeLog
from datetime import datetime

club_bp = Blueprint("club", __name__, url_prefix="/api/club")

@club_bp.post("/register")
def register_club():
    data = request.get_json(silent=True) or {}
    club = Club.from_request_data(data)

    club.last_edited_by = current_id
    club.last_edited_at = datetime.utcnow()

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
            changed_by=current_id,
            source="api/club/register POST",
            before_obj=None,
            after_obj=club.to_dict(),
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@club_bp.post("/edit")
def edit_club():
    data = request.get_json(silent=True) or {}
    club_abbreviation = (data.get("clubAbbreviation") or "").strip()
    
    if not club_abbreviation:
        return jsonify({"ok": False, "error": "Club abbreviation is required"}), 400

    existing = Club.find_by_identifier(club_abbreviation)
    if not existing:
        return jsonify({"ok": False, "error": "Club does not exist"}), 404

    before_snapshot = existing.to_dict()
    club = Club.from_request_data(data)
    club.club_abbreviation = club_abbreviation  

    club.last_edited_by = current_id
    club.last_edited_at = datetime.utcnow()

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
            changed_by=current_id,
            source="api/club/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@club_bp.post("/delete")
def delete_club():
    data = request.get_json(silent=True) or {}
    club_abbreviation = (data.get("clubAbbreviation") or "").strip()

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not club_abbreviation:
        return jsonify({"ok": False, "error": "Club abbreviation is required"}), 400

    try:
        club = Club.find_by_identifier(club_abbreviation)
        if not club:
            return jsonify({"ok": False, "error": "Club does not exist"}), 404
        
        before_snapshot = club.to_dict()
        club.delete(club_abbreviation)
        
        ChangeLog.log(
            changed_table="Club",
            record_pk=club_abbreviation,
            operation="DELETE",
            changed_by=current_id,
            source="api/club/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@club_bp.get("/get/<club_abbreviation>")
def get_club(club_abbreviation: str):
    club = Club.find_by_identifier(club_abbreviation)

    if not club:
        return jsonify({"ok": False, "error": "Club does not exist"}), 404

    return jsonify(club.to_dict()), 200


@club_bp.get("/list")
def list_all_clubs():
    try:
        clubs = Club.list_all_clubs()
    except AttributeError:
        return jsonify({"ok": False, "error": "Club.list_all_clubs() is not implemented yet"}), 500
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    clubs_data = [club.to_dict() for club in clubs]
    return jsonify(clubs_data), 200


@club_bp.get("/board")
def list_board():
    """
    Returns board roster derived from Club.BoardMember1/2.
    Shape:
      [
        { "club": "...", "clubAbbreviation": "...", "name": "...", "slot": "boardMember1" },
        ...
      ]

    Query params:
      active_only=true|false  (default true)
    """
    active_only_param = (request.args.get("active_only") or "true").strip().lower()
    active_only = active_only_param not in ("0", "false", "no")

    try:
        roster = Club.list_board_roster()
        return jsonify(roster), 200
    except AttributeError:
        return jsonify({"ok": False, "error": "Club.list_board_roster() is not implemented yet"}), 500
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
