from flask import Blueprint, jsonify, request
from datetime import datetime, timezone
from mysql.connector import Error
from classes.dog_owner import DogOwner, list_owner_people_for_dog
from classes.user_role import UserRole
from classes.change_log import ChangeLog
from database import fetch_one
from utils.auth_helpers import current_editor_id, current_role, require_scope

dog_owner_bp = Blueprint("dog_owner", __name__, url_prefix="/api/dog_owner")


@dog_owner_bp.get("/owners/<cwa_number>")
def owners_for_dog(cwa_number):
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_owner_scope, "view dog owners")
    # if deny:
    #     return deny

    # if role.view_dog_owner_scope == UserRole.SELF:
    #     if not _is_owner(cwa_number):
    #         return jsonify({"ok": False, "error": "Not allowed to view owners for this dog"}), 403

    data = list_owner_people_for_dog(cwa_number)
    return jsonify({"ok": True, "data": data}), 200


@dog_owner_bp.get("/get")
def list_dog_owner_links():
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.edit_dog_owner_scope, "view dog owners")
    # if deny:
    #     return deny

    cwa_id = (request.args.get("cwaId") or "").strip()
    person_id = (request.args.get("personId") or "").strip()

    try:
        # if role.edit_dog_owner_scope == UserRole.SELF:
            # if not current_editor_id():
                # return jsonify({"ok": False, "error": "Not signed in"}), 401

            # rows = DogOwner.list_all(cwa_id=cwa_id, person_id=current_editor_id())

        # else:
        rows = DogOwner.list_all_with_people()

        data = [r.to_dict() if hasattr(r, "to_dict") else r for r in (rows or [])]
        return jsonify({"ok": True, "data": data}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500



@dog_owner_bp.post("/add")
def add_owner():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_dog_owner_scope, "add dog owners")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    cwa_id = (data.get("cwaId") or "").strip()
    person_id = (data.get("personId") or "").strip()

    if not cwa_id or not person_id:
        return jsonify({"ok": False, "error": "cwaId and personId are required"}), 400

    if role.edit_dog_owner_scope == UserRole.SELF and person_id != current_editor_id():
        return jsonify({"ok": False, "error": "You may only add yourself as an owner"}), 403

    if not fetch_one("SELECT 1 FROM Dog WHERE CWANumber = %s LIMIT 1", (cwa_id,)):
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    if not fetch_one("SELECT 1 FROM Person WHERE PersonID = %s LIMIT 1", (person_id,)):
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    if DogOwner.exists(cwa_id, person_id):
        return jsonify({"ok": False, "error": "Owner link already exists"}), 409

    owner = DogOwner(
        cwa_id=cwa_id,
        person_id=person_id,
        last_edited_by=current_editor_id(),
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
            changed_by=current_editor_id(),
            source="api/dog_owner/add POST",
            before_obj=None,
            after_obj=owner.to_dict(),
        )

        return jsonify({"ok": True, "data": owner.to_dict()}), 201
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {e}"}), 500


@dog_owner_bp.post("/delete")
def remove_owner():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_dog_owner_scope, "delete dog owners")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    cwa_id = (data.get("cwaId") or "").strip()
    person_id = (data.get("personId") or "").strip()

    if not cwa_id or not person_id:
        return jsonify({"ok": False, "error": "cwaId and personId are required"}), 400

    if role.edit_dog_owner_scope == UserRole.SELF and person_id != current_editor_id():
        return jsonify({"ok": False, "error": "You may only remove yourself as an owner"}), 403

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
            changed_by=current_editor_id(),
            source="api/dog_owner/delete POST",
            before_obj=before_obj,
            after_obj=None,
        )

        return jsonify({"ok": True, "data": {"cwaId": cwa_id, "personId": person_id}}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {e}"}), 500


@dog_owner_bp.post("/transfer")
def transfer_primary_ownership():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_dog_owner_scope, "edit dog owners")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    cwa_id = (data.get("cwaId") or "").strip()
    new_owner_person_id = (data.get("newOwnerPersonId") or "").strip()

    if not cwa_id or not new_owner_person_id:
        return jsonify({"ok": False, "error": "cwaId and newOwnerPersonId are required"}), 400

    if role.edit_dog_owner_scope == UserRole.SELF:
        return jsonify({
            "ok": False,
            "error": "Transfer requires ALL permissions. You can only manage your own ownership."
        }), 403

    if not fetch_one("SELECT 1 FROM Dog WHERE CWANumber = %s LIMIT 1", (cwa_id,)):
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    if not fetch_one("SELECT 1 FROM Person WHERE PersonID = %s LIMIT 1", (new_owner_person_id,)):
        return jsonify({"ok": False, "error": "Person does not exist"}), 404

    try:
        old_owners = DogOwner.list_for_dog(cwa_id)
        before_owners = [{"cwaId": o.cwa_id, "personId": o.person_id} for o in old_owners if o]

        for old_owner in old_owners:
            if old_owner:
                ChangeLog.log(
                    changed_table="DogOwner",
                    record_pk=f"{old_owner.cwa_id}:{old_owner.person_id}",
                    operation="DELETE",
                    changed_by=current_editor_id(),
                    source="api/dog_owner/transfer POST",
                    before_obj=old_owner.to_dict(),
                    after_obj=None,
                )

        DogOwner.delete_all_for_dog(cwa_id)

        owner = DogOwner(
            cwa_id=cwa_id,
            person_id=new_owner_person_id,
            last_edited_by=current_editor_id(),
            last_edited_at=datetime.now(timezone.utc),
        )

        errors = owner.validate()
        if errors:
            return jsonify({"ok": False, "error": ", ".join(errors)}), 400

        owner.save()

        ChangeLog.log(
            changed_table="DogOwner",
            record_pk=cwa_id,
            operation="TRANSFER",
            changed_by=current_editor_id(),
            source="api/dog_owner/transfer POST",
            before_obj={"owners": before_owners},
            after_obj={"owners": [{"cwaId": cwa_id, "personId": new_owner_person_id}]},
        )

        owners = list_owner_people_for_dog(cwa_id)
        return jsonify({"ok": True, "data": {"cwaId": cwa_id, "owners": owners}}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {e}"}), 500