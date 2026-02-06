from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from datetime import datetime, timezone
from classes.dog import Dog
from classes.dog_owner import DogOwner
from classes.change_log import ChangeLog
from classes.user_role import UserRole

dog_bp = Blueprint("dog", __name__, url_prefix="/api/dog")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    pid = u.get("PersonID")
    return pid if pid else None

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


def _is_owner(cwa_number: str) -> bool:
    person_id = _current_editor_id()
    if not person_id:
        return False
    return DogOwner.exists(cwa_number, person_id)


@dog_bp.post("/register")
def register_dog():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_dog_scope, "create dogs")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    dog = Dog.from_request_data(data)

    dog.last_edited_by = _current_editor_id()
    dog.last_edited_at = datetime.now(timezone.utc)

    validation_errors = dog.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Dog.exists(dog.cwa_number):
        return jsonify({"ok": False, "error": "Dog already exists"}), 409

    try:
        dog.save()

        pid = _current_editor_id()
        if pid and not DogOwner.exists(dog.cwa_number, pid):
            DogOwner(
                cwa_id=dog.cwa_number,
                person_id=pid,
                last_edited_by=pid,
                last_edited_at=datetime.now(timezone.utc),
            ).save()

        ChangeLog.log(
            changed_table="Dog",
            record_pk=dog.cwa_number,
            operation="INSERT",
            changed_by=_current_editor_id(),
            source="api/dog/register POST",
            before_obj=None,
            after_obj=dog.to_dict(),
        )

        return jsonify({"ok": True}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.post("/edit")
def edit_dog():
    role = _current_role()
    if not role:
        return  jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_dog_scope, "edit dogs")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    dog = Dog.from_request_data(data)

    if not dog.cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400

    existing = Dog.find_by_identifier(dog.cwa_number)
    if not existing:
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    if role.edit_dog_scope == UserRole.SELF and not _is_owner(dog.cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to edit this dog"}), 403

    before_snapshot = existing.to_dict()

    dog.cwa_number = dog.cwa_number
    dog.last_edited_by = _current_editor_id()
    dog.last_edited_at = datetime.now(timezone.utc)

    validation_errors = dog.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    try:
        dog.update()

        refreshed_dog = Dog.find_by_identifier(dog.cwa_number)
        after_snapshot = refreshed_dog.to_dict() if refreshed_dog else None

        ChangeLog.log(
            changed_table="Dog",
            record_pk=dog.cwa_number,
            operation="UPDATE",
            changed_by=_current_editor_id(),
            source="api/dog/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.post("/delete")
def delete_dog():
    role = _current_role()
    if not role:
        return  jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_dog_scope, "delete dogs")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    dog = Dog.from_request_data(data)

    if data.get("confirm") is not True:
        return jsonify({"ok": False, "error": "Confirmation required"}), 400
    if not dog.cwa_number:
        return jsonify({"ok": False, "error": "CWA Number is required"}), 400

    try:
        dog = Dog.find_by_identifier(dog.cwa_number)
        if not dog:
            return jsonify({"ok": False, "error": "Dog does not exist"}), 404

        if role.edit_dog_scope == UserRole.SELF and not _is_owner(dog.cwa_number):
            return jsonify({"ok": False, "error": "Not allowed to delete this dog"}), 403

        before_snapshot = dog.to_dict()

        DogOwner.delete_all_for_dog(dog.cwa_number)
        Dog.delete(dog.cwa_number)

        ChangeLog.log(
            changed_table="Dog",
            record_pk=dog.cwa_number,
            operation="DELETE",
            changed_by=_current_editor_id(),
            source="api/dog/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.get("/get/<cwa_number>")
def get_dog(cwa_number):
    role = _current_role()
    if not role:
        return  jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny

    dog = Dog.find_by_identifier(cwa_number)
    if not dog:
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403

    return jsonify({"ok": True, "data": dog.to_dict()}), 200


@dog_bp.get("/list")
def list_all_dogs():
    role = _current_role()
    if not role:
        return  jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny

    try:
        if role.view_dog_scope == UserRole.ALL:
            dogs = Dog.list_all_dogs()
        else:
            pid = _current_editor_id()
            if not pid:
                return  jsonify({"ok": False, "error": "Not signed in"}), 401
            dogs = Dog.list_dogs_for_owner(pid)

        dogs_data = [dog.to_dict() for dog in dogs]
        return jsonify({"ok": True, "data": dogs_data}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.get("/titles/<cwa_number>")
def list_dog_titles(cwa_number):
    role = _current_role()
    if not role:
        return  jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_dog_titles_scope, "view dog titles")
    if deny:
        return deny

    dog = Dog.find_by_identifier(cwa_number)
    if not dog:
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    if role.view_dog_titles_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view titles for this dog"}), 403

    try:
        dog_titles = dog.check_titles()
        return jsonify({"ok": True, "data": dog_titles}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

@dog_bp.get("/grade/<cwa_number>")
def get_dog_grade(cwa_number):
    role = _current_role()
    if not role:
        return  jsonify({"ok": False, "error": "Not signed in"}), 401
    
    if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny
    
    try:
        dog = Dog.find_by_identifier(cwa_number)
        if not dog:
            return jsonify({"ok": False, "error": "Dog not found"}), 404

        computed = dog.check_grade()
        return jsonify(
            {
                "ok": True,
                "data": {
                    "cwaNumber": dog.cwa_number,
                    "computedGrade": computed,
                },
            }
        ), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@dog_bp.get("/age/<cwa_number>")
def get_dog_age(cwa_number):
    role = _current_role()
    if not role:
        return  jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny
    
    if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403
    
    try:
        dog = Dog.find_by_identifier(cwa_number)
        if not dog:
            return jsonify({"ok": False, "error": "Dog not found"}), 404

        birthdate = dog.birthdate
        if not birthdate:
            return jsonify(
                {"ok": True, "data": {"cwaNumber": dog.cwa_number, "birthdate": None}}
            ), 200

        if isinstance(birthdate, str):
            birthdate = datetime.strptime(birthdate, "%Y-%m-%d")

        today = datetime.today()
        age_months = ((today.year - birthdate.year) * 12) + (today.month - birthdate.month)

        is_puppy = dog.is_puppy()
        is_adult = dog.is_adult()
        is_veteran = dog.is_veteran()

        if is_veteran:
            category = "veteran"
        elif is_adult:
            category = "adult"
        elif is_puppy:
            category = "puppy"
        else:
            category = "unknown"

        return jsonify(
            {
                "ok": True,
                "data": {
                    "cwaNumber": dog.cwa_number,
                    "birthdate": dog.birthdate,
                    "ageMonths": age_months,
                    "category": category,
                    "isPuppy": is_puppy,
                    "isAdult": is_adult,
                    "isVeteran": is_veteran,
                },
            }
        ), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@dog_bp.get("/mine")
def list_my_dogs():
    role = _current_role()
    if not role:
        return  jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny
    
    try:
        u = session.get("user") or {}
        person_id = u.get("PersonID") or u.get("personId") or u.get("id")
        if not person_id:
            return jsonify({"ok": False, "error": "Not signed in"}), 401

        dogs = Dog.list_dogs_for_owner(person_id)
        return jsonify({"ok": True, "data": [d.to_dict() for d in dogs]}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:

        return jsonify({"ok": False, "error": str(e)}), 500

@dog_bp.post("/arx/<cwa_number>")
def check_arx_title(cwa_number):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    
    if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny
    
    dog = Dog.find_by_identifier(cwa_number)
    if not dog:
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404
    try:
        arx = dog.check_arx_title()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True, "arx": arx}), 200

@dog_bp.post("/trp/<cwa_number>")
def check_trp_title(cwa_number):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    
    if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny
    
    try:
        dog = Dog.find_by_identifier(cwa_number)
        if not dog:
            return jsonify({"ok": False, "error": "Dog does not exist"}), 404
        
        trp = dog.check_trp_title()
        return jsonify(
            {
                "ok": True,
                "data": {
                    "cwaNumber": dog.cwa_number,
                    "trpTitle": trp,
                },
            }
        ), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@dog_bp.post("/pr/<cwa_number>")
def check_pr_title(cwa_number):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    
    if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny

    try:
        dog = Dog.find_by_identifier(cwa_number)
        if not dog:
            return jsonify({"ok": False, "error": "Dog does not exist"}), 404
        
        pr = dog.check_pr_title()
        return jsonify(
            {
                "ok": True,
                "data": {
                    "cwaNumber": dog.cwa_number,
                    "prTitle": pr,
                },
            }
        ), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.post("/narx/<cwa_number>")
def check_narx_title(cwa_number):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    
    if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny
    
    try:
        dog = Dog.find_by_identifier(cwa_number)
        if not dog:
            return jsonify({"ok": False, "error": "Dog does not exist"}), 404
        
        narx = dog.check_narx_title()
        return jsonify(
            {
                "ok": True,
                "data": {
                    "cwaNumber": dog.cwa_number,
                    "narxTitle": narx,
                },
            }
        ), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@dog_bp.post("/dpc/<cwa_number>")
def check_dpc_title(cwa_number):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    
    if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny
    
    try:
        dog = Dog.find_by_identifier(cwa_number)
        if not dog:
            return jsonify({"ok": False, "error": "Dog does not exist"}), 404
        
        dpc = dog.check_dpc_title()
        return jsonify(
            {
                "ok": True,
                "data": {
                    "cwaNumber": dog.cwa_number,
                    "dpcTitle": dpc,
                },
            }
        ), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@dog_bp.post("/hc/<cwa_number>")
def check_hc_title(cwa_number):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    
    if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403

    deny = _require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny
    
    try:
        dog = Dog.find_by_identifier(cwa_number)
        if not dog:
            return jsonify({"ok": False, "error": "Dog does not exist"}), 404
        
        hc = dog.check_hc_title()
        return jsonify(
            {
                "ok": True,
                "data": {
                    "cwaNumber": dog.cwa_number,
                    "hcTitle": hc,
                },
            }
        ), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
