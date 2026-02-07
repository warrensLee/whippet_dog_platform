from flask import Blueprint, jsonify, request, session
from datetime import datetime, timezone
from mysql.connector import Error
from classes.dog_owner import DogOwner, list_owner_people_for_dog
from classes.user_role import UserRole
from classes.change_log import ChangeLog
from database import fetch_one

dog_owner_bp = Blueprint("dog_owner", __name__, url_prefix="/api/dog_owner")


def _current_editor_id() -> str | None:
    """Get the current user's PersonID from session."""
    u = session.get("user") or {}
    return u.get("PersonID") or u.get("personId") or u.get("id")


def _current_role() -> UserRole | None:
    """Get the current user's role from session."""
    u = session.get("user") or {}
    pid = _current_editor_id()
    if not pid:
        return None

    title = u.get("SystemRole")
    if not title:
        return None

    return UserRole.find_by_title(title.strip().upper())


def _require_scope(scope_value: int, action: str):
    """Check if user has required permissions."""
    if int(scope_value or 0) == UserRole.NONE:
        return jsonify({"ok": False, "error": f"Not allowed to {action}"}), 403
    return None


def _is_owner(cwa_number: str) -> bool:
    """Check if current user owns the specified dog."""
    person_id = _current_editor_id()
    if not person_id:
        return False
    return DogOwner.exists(cwa_number, person_id)


@dog_owner_bp.get("/owners/<cwa_number>")
def owners_for_dog(cwa_number: str):
    """Get list of all owners for a specific dog."""
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_dog_owner_scope, "view dog owners")
    if deny:
        return deny

    if role.view_dog_owner_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view owners for this dog"}), 403

    data = list_owner_people_for_dog(cwa_number)
    return jsonify({"ok": True, "data": data}), 200


@dog_owner_bp.post("/get")
def get_dog_owner_link():
    """Get a specific dog-owner relationship link."""
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_dog_owner_scope, "view dog owners")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    cwa_id = (data.get("cwaId") or "").strip()
    person_id = (data.get("personId") or "").strip()
    
    if not cwa_id or not person_id:
        return jsonify({"ok": False, "error": "cwaId and personId are required"}), 400

    if role.view_dog_owner_scope == UserRole.SELF and not _is_owner(cwa_id):
        return jsonify({"ok": False, "error": "Not allowed to view owners for this dog"}), 403

    link = DogOwner.find_by_identifier(cwa_id, person_id)
    if not link:
        return jsonify({"ok": False, "error": "Owner link does not exist"}), 404

    return jsonify({"ok": True, "data": link.to_dict()}), 200


@dog_owner_bp.post("/add")
def add_owner():
    """Add a new owner to a dog."""
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_dog_owner_scope, "edit dog owners")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    cwa_id = (data.get("cwaId") or "").strip()
    person_id = (data.get("personId") or "").strip()
    
    if not cwa_id or not person_id:
        return jsonify({"ok": False, "error": "cwaId and personId are required"}), 400

    if role.edit_dog_owner_scope == UserRole.SELF and not _is_owner(cwa_id):
        return jsonify({"ok": False, "error": "Not allowed to edit owners for this dog"}), 403

    if not fetch_one("SELECT 1 FROM Dog WHERE CWANumber = %s LIMIT 1", (cwa_id,)):
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    if not fetch_one("SELECT 1 FROM Person WHERE PersonID = %s LIMIT 1", (person_id,)):
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    if DogOwner.exists(cwa_id, person_id):
        return jsonify({"ok": False, "error": "Owner link already exists"}), 409

    owner = DogOwner(
        cwa_id=cwa_id,
        person_id=person_id,
        last_edited_by=_current_editor_id(),
        last_edited_at=datetime.now(timezone.utc),
    )

    errors = owner.validate()
    if errors:
        return jsonify({"ok": False, "error": ", ".join(errors)}), 400

    try:
        owner.save()
        
        ChangeLog.log(
            changed_table="DogOwner",
            record_pk=f"{cwa_id}:{person_id}",
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/dog_owner/add POST",
            before_obj=None,
            after_obj=owner.to_dict(),
        )
        
        return jsonify({"ok": True, "data": owner.to_dict()}), 201
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {e}"}), 500


@dog_owner_bp.post("/delete")
def remove_owner():
    """Remove an owner from a dog."""
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_dog_owner_scope, "edit dog owners")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    cwa_id = (data.get("cwaId") or "").strip()
    person_id = (data.get("personId") or "").strip()
    
    if not cwa_id or not person_id:
        return jsonify({"ok": False, "error": "cwaId and personId are required"}), 400

    if role.edit_dog_owner_scope == UserRole.SELF and not _is_owner(cwa_id):
        return jsonify({"ok": False, "error": "Not allowed to edit owners for this dog"}), 403

    existing = DogOwner.find_by_identifier(cwa_id, person_id)
    if not existing:
        return jsonify({"ok": False, "error": "Owner link does not exist"}), 404

    before_obj = existing.to_dict()

    try:
        DogOwner.delete_one(cwa_id, person_id)
        
        ChangeLog.log(
            changed_table="DogOwner",
            record_pk=f"{cwa_id}:{person_id}",
            operation="DELETE",
            changed_by=_current_editor_id(),
            source="api/dog_owner/remove POST",
            before_obj=before_obj,
            after_obj=None,
        )
        
        return jsonify({"ok": True, "data": {"cwaId": cwa_id, "personId": person_id}}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {e}"}), 500


@dog_owner_bp.post("/transfer")
def transfer_primary_ownership():
    """Transfer ownership - removes all current owners and sets a new single owner."""
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_dog_owner_scope, "edit dog owners")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    cwa_id = (data.get("cwaId") or "").strip()
    new_owner_person_id = (data.get("newOwnerPersonId") or "").strip()
    
    if not cwa_id or not new_owner_person_id:
        return jsonify({"ok": False, "error": "cwaId and newOwnerPersonId are required"}), 400

    if role.edit_dog_owner_scope == UserRole.SELF and not _is_owner(cwa_id):
        return jsonify({"ok": False, "error": "Not allowed to edit owners for this dog"}), 403

    if not fetch_one("SELECT 1 FROM Dog WHERE CWANumber = %s LIMIT 1", (cwa_id,)):
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    if not fetch_one("SELECT 1 FROM Person WHERE PersonID = %s LIMIT 1", (new_owner_person_id,)):
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    try:
        old_owners = DogOwner.list_for_dog(cwa_id)
        before_owners = [
            {"cwaId": o.cwa_id, "personId": o.person_id}
            for o in old_owners if o
        ]

        for old_owner in old_owners:
            if old_owner:
                ChangeLog.log(
                    changed_table="DogOwner",
                    record_pk=f"{old_owner.cwa_id}:{old_owner.person_id}",
                    operation="DELETE",
                    changed_by=_current_editor_id(),
                    source="api/dog_owner/transfer POST",
                    before_obj=old_owner.to_dict(),
                    after_obj=None,
                )
        
        DogOwner.delete_all_for_dog(cwa_id)

        owner = DogOwner(
            cwa_id=cwa_id,
            person_id=new_owner_person_id,
            last_edited_by=_current_editor_id(),
            last_edited_at=datetime.now(timezone.utc),
        )

        errors = owner.validate()
        if errors:
            return jsonify({"ok": False, "error": ", ".join(errors)}), 400

        owner.save()
        
        ChangeLog.log(
            changed_table="DogOwner",
            record_pk=f"{cwa_id}:{new_owner_person_id}",
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/dog_owner/transfer POST",
            before_obj=None,
            after_obj=owner.to_dict(),
        )
        
        ChangeLog.log(
            changed_table="DogOwner",
            record_pk=cwa_id,
            operation="TRANSFER",
            changed_by=_current_editor_id(),
            source="api/dog_owner/transfer POST",
            before_obj={"owners": before_owners},
            after_obj={"owners": [{"cwaId": cwa_id, "personId": new_owner_person_id}]},
        )

        owners = list_owner_people_for_dog(cwa_id)
        return jsonify({"ok": True, "data": {"cwaId": cwa_id, "owners": owners}}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {e}"}), 500