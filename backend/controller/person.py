from flask import Blueprint, jsonify, request
from mysql.connector import Error
from datetime import datetime, timezone
from database import fetch_all, fetch_one
from classes.person import Person
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from utils.auth_helpers import current_editor_id, current_role, require_scope

person_bp = Blueprint("person", __name__, url_prefix="/api/person")

def _is_owner(person_id):
    """Check if current user is the specified person."""
    current_id = current_editor_id()
    if not current_id:
        return False
    return current_id == person_id


def _has_role(person_id, role_name):
    """Check if person has an active officer role."""
    sql = """
        SELECT COUNT(*) AS count
        FROM OfficerRole
        WHERE PersonID = %s 
        AND RoleName LIKE %s 
        AND Active = 1
    """
    try:
        row = fetch_one(sql, [person_id, f"%{role_name}%"])
        return int(row.get("count", 0)) > 0 if row else False
    except Error:
        return False


# ============================================================
# POST /api/person/add
# Create a new person/user account
# ============================================================
@person_bp.post("/add")
def register_person():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_person_scope, "create people")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    
    password = (data.get("password") or "").strip()
    if not password:
        return jsonify({"ok": False, "error": "Password is required"}), 400
    if len(password) < 6:
        return jsonify({"ok": False, "error": "Password must be at least 6 characters"}), 400

    person = Person.from_request_data(data)
    person.set_password(password)

    if not person.system_role:
        person.system_role = "PUBLIC"

    editor_id = current_editor_id()
    person.last_edited_by = editor_id
    person.last_edited_at = datetime.now(timezone.utc)

    validation_errors = person.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Person.exists(person.person_id):
        return jsonify({"ok": False, "error": "Person already exists"}), 409

    try:
        person.save()
        ChangeLog.log(
            changed_table="Person",
            record_pk=person.person_id,
            operation="INSERT",
            changed_by=editor_id,
            source="api/person/add POST",
            before_obj=None,
            after_obj=person.to_dict(),
        )
        return jsonify({"ok": True, "data": {"personId": person.person_id}}), 201
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


# ============================================================
# POST /api/person/edit
# Edit an existing person
# ============================================================
@person_bp.post("/edit")
def edit_person():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_person_scope, "edit people")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    person_id = (data.get("personId") or "").strip()
    if not person_id:
        return jsonify({"ok": False, "error": "Person ID is required"}), 400

    if role.edit_person_scope == UserRole.SELF and not _is_owner(person_id):
        return jsonify({"ok": False, "error": "You can only edit your own profile"}), 403

    existing = Person.find_by_identifier(person_id)
    if not existing:
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    before_snapshot = existing.to_dict()

    person = Person.from_request_data(data)
    person.person_id = person_id

    person.password_hash = existing.password_hash

    if role.edit_person_scope != UserRole.ALL:
        person.system_role = existing.system_role

    person.last_edited_by = current_editor_id()
    person.last_edited_at = datetime.now(timezone.utc)

    validation_errors = person.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        person.update()
        refreshed = Person.find_by_identifier(person_id)
        after_snapshot = refreshed.to_dict() if refreshed else person.to_dict()

        ChangeLog.log(
            changed_table="Person",
            record_pk=person_id,
            operation="UPDATE",
            changed_by=current_editor_id(),
            source="api/person/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
        return jsonify({"ok": True}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


# ============================================================
# POST /api/person/change-password
# Change current user's password
# ============================================================
@person_bp.post("/change-password")
def change_password():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    data = request.get_json(silent=True) or {}
    current_password = (data.get("currentPassword") or "").strip()
    new_password = (data.get("newPassword") or "").strip()

    if not current_password or not new_password:
        return jsonify({"ok": False, "error": "Current and new password are required"}), 400
    if len(new_password) < 6:
        return jsonify({"ok": False, "error": "New password must be at least 6 characters"}), 400

    current_id = current_editor_id()
    if not current_id:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    try:
        person = Person.find_by_identifier(current_id)
        if not person:
            return jsonify({"ok": False, "error": "User not found"}), 404

        if not person.check_password(current_password):
            return jsonify({"ok": False, "error": "Current password is incorrect"}), 400

        before_snapshot = person.to_dict()

        person.set_password(new_password)
        person.last_edited_by = current_id
        person.last_edited_at = datetime.now(timezone.utc)
        person.update()

        refreshed = Person.find_by_identifier(current_id)
        after_snapshot = refreshed.to_dict() if refreshed else person.to_dict()

        ChangeLog.log(
            changed_table="Person",
            record_pk=current_id,
            operation="UPDATE",
            changed_by=current_id,
            source="api/person/change-password POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
        return jsonify({"ok": True}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


# ============================================================
# POST /api/person/change-user-role
# Change a user's system role (admin only)
# ============================================================
@person_bp.post("/change-user-role")
def change_user_role():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(UserRole.ALL, "edit person")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    person_id = (data.get("personId") or "").strip()
    new_role = (data.get("systemRole") or "").strip().upper()

    if not person_id:
        return jsonify({"ok": False, "error": "Person ID is required"}), 400
    if not new_role:
        return jsonify({"ok": False, "error": "System role is required"}), 400

    try:
        person = Person.find_by_identifier(person_id)
        if not person:
            return jsonify({"ok": False, "error": "Person does not exist"}), 404

        if person.system_role == new_role:
            return jsonify({"ok": False, "error": f"Person already has role '{new_role}'"}), 400

        before_snapshot = person.to_dict()

        person.system_role = new_role
        person.last_edited_by = current_editor_id()
        person.last_edited_at = datetime.now(timezone.utc)
        person.update()

        refreshed = Person.find_by_identifier(person_id)
        after_snapshot = refreshed.to_dict() if refreshed else person.to_dict()

        ChangeLog.log(
            changed_table="Person",
            record_pk=person_id,
            operation="UPDATE",
            changed_by=current_editor_id(),
            source="api/person/change-user-role POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )
        return jsonify({"ok": True, "data": {"systemRole": new_role}}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


# ============================================================
# GET /api/person/get/<person_id>
# Get a specific person by ID
# ============================================================
@person_bp.get("/get/<person_id>")
def get_person(person_id: str):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_person_scope, "view people")
    if deny:
        return deny

    if role.view_person_scope == UserRole.SELF and not _is_owner(person_id):
        return jsonify({"ok": False, "error": "Forbidden"}), 403

    person = Person.find_by_identifier(person_id)
    if not person:
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    return jsonify({"ok": True, "data": person.to_dict()}), 200


# ============================================================
# GET /api/person/get
# List all persons (admin only)
# ============================================================
@person_bp.get("/get")
def list_all_persons():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_person_scope, "view people")
    if deny:
        return deny

    if role.view_person_scope != UserRole.ALL:
        return jsonify({"ok": False, "error": "Not allowed to list all people"}), 403

    try:
        persons = Person.list_all_persons()
        persons_data = [p.to_dict() for p in persons]
        return jsonify({"ok": True, "data": persons_data}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


# ============================================================
# GET /api/person/search?q=<query>&activeOnly=<true|false>
# Search people by ID, name, email, or role keywords
# ============================================================
@person_bp.get("/search")
def search_people():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_person_scope, "search people")
    if deny:
        return deny

    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"ok": False, "error": "Query param 'q' is required"}), 400

    active_only = (request.args.get("activeOnly") or "true").strip().lower() != "false"

    if role.view_person_scope == UserRole.SELF:
        pid = current_editor_id()
        if not pid:
            return jsonify({"ok": False, "error": "Not signed in"}), 401

        person = Person.find_by_identifier(pid)
        if not person:
            return jsonify({"ok": True, "data": []}), 200

        haystack = " ".join([
            person.person_id or "",
            person.first_name or "",
            person.last_name or "",
            person.email_address or "",
        ]).lower()

        if q.lower() in haystack:
            return jsonify({"ok": True, "data": [person.to_dict()]}), 200
        return jsonify({"ok": True, "data": []}), 200

    like = f"%{q}%"
    q_norm = q.lower()
    
    role_terms = []
    if "board" in q_norm:
        role_terms.append("%board%")
    if "judge" in q_norm:
        role_terms.append("%judge%")
    if "secretary" in q_norm:
        role_terms.append("%secretary%")
    role_terms.append(like)  

    role_like_sql = " OR ".join(["orole.RoleName LIKE %s"] * len(role_terms))

    sql = f"""
        SELECT DISTINCT
            p.PersonID,
            p.FirstName,
            p.LastName,
            p.EmailAddress,
            p.SystemRole,
            p.AddressLineOne,
            p.AddressLineTwo,
            p.City,
            p.StateProvince,
            p.ZipCode,
            p.Country,
            p.PrimaryPhone,
            p.SecondaryPhone,
            p.Notes,
            p.LastEditedBy,
            p.LastEditedAt
        FROM Person p
        LEFT JOIN OfficerRole orole ON orole.PersonID = p.PersonID
        WHERE (
            p.PersonID LIKE %s
            OR CONCAT(p.FirstName, ' ', p.LastName) LIKE %s
            OR p.FirstName LIKE %s
            OR p.LastName LIKE %s
            OR p.EmailAddress LIKE %s
            OR ({role_like_sql})
        )
    """
    params = [like, like, like, like, like] + role_terms

    if active_only:
        sql += " AND (orole.PersonID IS NULL OR orole.Active = 1)"

    sql += """
        ORDER BY p.LastName ASC, p.FirstName ASC, p.PersonID ASC
        LIMIT 200
    """

    try:
        rows = fetch_all(sql, params) or []
        people = []
        for row in rows:
            p = Person.from_db_row(row) if hasattr(Person, "from_db_row") else None
            people.append(p.to_dict() if p else row)
        return jsonify({"ok": True, "data": people}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


# ============================================================
# GET /api/person/mine
# Get current user's profile
# ============================================================
@person_bp.get("/mine")
def get_my_person():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_person_scope, "view your profile")
    if deny:
        return deny

    pid = current_editor_id()
    if not pid:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    try:
        person = Person.find_by_identifier(pid)
        if not person:
            return jsonify({"ok": False, "error": "Person does not exist"}), 404

        return jsonify({"ok": True, "data": person.to_dict()}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


# ============================================================
# GET /api/person/is-board-member/<person_id>
# Check if person has an active board member role
# ============================================================
@person_bp.get("/is-board-member/<person_id>")
def is_board_member(person_id: str):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_person_scope, "view roles")
    if deny:
        return deny

    if role.view_person_scope == UserRole.SELF and not _is_owner(person_id):
        return jsonify({"ok": False, "error": "Forbidden"}), 403

    try:
        is_member = _has_role(person_id, "board")
        return jsonify({"ok": True, "data": {"isBoardMember": is_member}}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


# ============================================================
# GET /api/person/is-secretary/<person_id>
# Check if person has an active secretary role
# ============================================================
@person_bp.get("/is-secretary/<person_id>")
def is_secretary(person_id: str):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_person_scope, "view roles")
    if deny:
        return deny

    if role.view_person_scope == UserRole.SELF and not _is_owner(person_id):
        return jsonify({"ok": False, "error": "Forbidden"}), 403

    try:
        is_sec = _has_role(person_id, "secretary")
        return jsonify({"ok": True, "data": {"isSecretary": is_sec}}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


# ============================================================
# GET /api/person/is-judge/<person_id>
# Check if person has an active judge role
# ============================================================
@person_bp.get("/is-judge/<person_id>")
def is_judge(person_id: str):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_person_scope, "view roles")
    if deny:
        return deny

    if role.view_person_scope == UserRole.SELF and not _is_owner(person_id):
        return jsonify({"ok": False, "error": "Forbidden"}), 403

    try:
        is_jdg = _has_role(person_id, "judge")
        return jsonify({"ok": True, "data": {"isJudge": is_jdg}}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500