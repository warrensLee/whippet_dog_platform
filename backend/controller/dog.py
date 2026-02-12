from flask import Blueprint, jsonify, request
from mysql.connector import Error
from datetime import datetime, timezone
from classes.dog import Dog
from classes.dog_title import DogTitle
from classes.dog_owner import DogOwner
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from utils.auth_helpers import current_editor_id, current_role, require_scope


dog_bp = Blueprint("dog", __name__, url_prefix="/api/dog")

def _is_owner(cwa_number):
    person_id = current_editor_id()
    if not person_id:
        return False
    return DogOwner.exists(cwa_number, person_id)


@dog_bp.post("/add")
def register_dog():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_dog_scope, "create dogs")
    if deny:
        return deny

    data = request.get_json(silent=True) or {}
    dog = Dog.from_request_data(data)

    dog.last_edited_by = current_editor_id()
    dog.last_edited_at = datetime.now(timezone.utc)

    validation_errors = dog.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if Dog.exists(dog.cwa_number):
        return jsonify({"ok": False, "error": "Dog already exists"}), 409

    try:
        dog.save()
        ChangeLog.log(
            changed_table="Dog",
            record_pk=dog.cwa_number,
            operation="INSERT",
            changed_by=current_editor_id(),
            source="api/dog/register POST",
            before_obj=None,
            after_obj=dog.to_dict(),
        )

        #update titles based on dog attributes
        DogTitle.sync_titles_for_dog(dog, current_editor_id(), datetime.now(timezone.utc))

        return jsonify({"ok": True}), 201

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.post("/edit")
def edit_dog():
    role = current_role()
    if not role:
        return  jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_dog_scope, "edit dogs")
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
    dog.last_edited_by = current_editor_id()
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
            changed_by=current_editor_id(),
            source="api/dog/edit POST",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        #update titles based on dog attributes
        DogTitle.sync_titles_for_dog(dog, current_editor_id(), datetime.now(timezone.utc))

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.post("/delete")
def delete_dog():
    role = current_role()
    if not role:
        return  jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_dog_scope, "delete dogs")
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

        owners = DogOwner.list_for_dog(dog.cwa_number)
        titles = DogTitle.list_for_dog(dog.cwa_number)

        # Delete owners
        for owner in owners:
            ChangeLog.log(
                changed_table="DogOwner",
                record_pk=f"{owner['CWAID']}:{owner['PersonID']}",
                operation="DELETE",
                changed_by=current_editor_id(),
                source="api/dog/delete POST",
                before_obj=owner,
                after_obj=None,
            )

        DogOwner.delete_all_for_dog(dog.cwa_number)

        # Delete titles
        for title in titles:
            ChangeLog.log(
                changed_table="DogTitles",
                record_pk=f"{title['CWANumber']}:{title['Title']}",
                operation="DELETE",
                changed_by=current_editor_id(),
                source="api/dog/delete POST",
                before_obj=title,
                after_obj=None,
            )

        DogTitle.delete_all_for_dog(dog.cwa_number)
        
        #remove dog record
        Dog.delete(dog.cwa_number)

        ChangeLog.log(
            changed_table="Dog",
            record_pk=dog.cwa_number,
            operation="DELETE",
            changed_by=current_editor_id(),
            source="api/dog/delete POST",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"ok": True}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.get("/get/<cwa_number>")
def get_dog(cwa_number):
    # role = current_role()
    # if not role:
    #     return  jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "view dogs")
    # if deny:
    #     return deny

    dog = Dog.find_by_identifier(cwa_number)
    if not dog:
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    # if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403

    return jsonify({"ok": True, "data": dog.to_dict()}), 200

@dog_bp.get("/get")
def list_all_dogs():
    # role = current_role()
    # if not role:
    #     return  jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "view dogs")
    # if deny:
    #     return deny

    try:
        # if role.view_dog_scope == UserRole.ALL:
        dogs = Dog.list_all_dogs()
        # else:
        #     pid = current_editor_id()
        #     if not pid:
        #         return  jsonify({"ok": False, "error": "Not signed in"}), 401
        #     dogs = Dog.list_dogs_for_owner(pid)

        dogs_data = [dog.to_dict() for dog in dogs]
        return jsonify({"ok": True, "data": dogs_data}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.get("/titles/<cwa_number>")
def list_dog_titles(cwa_number):
    # role = current_role()
    # if not role:
    #     return  jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_titles_scope, "view dog titles")
    # if deny:
    #     return deny

    dog = Dog.find_by_identifier(cwa_number)
    if not dog:
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404

    # if role.view_dog_titles_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view titles for this dog"}), 403

    try:
        dog_titles = dog.check_titles()
        return jsonify({"ok": True, "data": dog_titles}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

@dog_bp.get("/grade/<cwa_number>")
def get_dog_grade(cwa_number):
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "view dogs")
    # if deny:
    #     return deny
    
    # if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403
    
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
    # role = current_role()
    # if not role:
    #     return  jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "view dogs")
    # if deny:
    #     return deny
    
    # if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403
    
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


@dog_bp.get("/my-dogs")
def list_my_dogs():
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "view dogs")
    # if deny:
    #     return deny
    
    try:
        dogs = Dog.list_dogs_for_owner(current_editor_id())
        return jsonify({"ok": True, "data": [d.to_dict() for d in dogs]}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@dog_bp.get("/arx/<cwa_number>")
def check_arx_title(cwa_number):
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "view dogs")
    # if deny:
    #     return deny
    
    # if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403
    
    dog = Dog.find_by_identifier(cwa_number)
    if not dog:
        return jsonify({"ok": False, "error": "Dog does not exist"}), 404
    
    try:
        arx = dog.check_arx_title()
        return jsonify({"ok": True, "arx": arx}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.get("/trp/<cwa_number>")
def check_trp_title(cwa_number):
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "view dogs")
    # if deny:
    #     return deny
    
    # if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403
    
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

@dog_bp.get("/pr/<cwa_number>")
def check_pr_title(cwa_number):
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.view_dog_scope, "view dogs")
    if deny:
        return deny
    
    if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
        return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403

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


@dog_bp.get("/narx/<cwa_number>")
def check_narx_title(cwa_number):
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "view dogs")
    # if deny:
    #     return deny
    
    # if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403
    
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

@dog_bp.get("/dpc/<cwa_number>")
def check_dpc_title(cwa_number):
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "view dogs")
    # if deny:
    #     return deny
    
    # if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403
    
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

@dog_bp.get("/hc/<cwa_number>")
def check_hc_title(cwa_number):
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "view dogs")
    # if deny:
    #     return deny
    
    # if role.view_dog_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view this dog"}), 403
    
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


# This endpoint allows searching dogs by various attributes 
@dog_bp.get("/search")
def search_dogs():
    role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_dog_scope, "search dogs")
    # if deny:
    #     return deny

    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"ok": False, "error": "Query param 'q' is required"}), 400

    try:
        rows = Dog.search(
            query=q,
            only_owner_person_id=None,
        )

        data = []
        for item in rows:
            data.append(item.to_dict() if hasattr(item, "to_dict") else item)

        return jsonify({"ok": True, "data": data}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500


@dog_bp.get("/meets/<cwa_number>")
def list_meets_for_dog(cwa_number):
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_meet_scope, "view meets")
    # if deny:
    #     return deny

    # if role.view_meet_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view meets for this dog"}), 403

    try:
        meets = Dog.list_meets_with_results_for_dog(cwa_number)  
        return jsonify({"ok": True, "data": meets}), 200
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

@dog_bp.get("/wins/<cwa_number>")
def get_dog_stats(cwa_number):
    # role = current_role()
    # if not role:
    #     return jsonify({"ok": False, "error": "Not signed in"}), 401

    # deny = require_scope(role.view_meet_results_scope, "view meet results")
    # if deny:
    #     return deny

    # if role.view_meet_results_scope == UserRole.SELF and not _is_owner(cwa_number):
    #     return jsonify({"ok": False, "error": "Not allowed to view stats for this dog"}), 403

    try:
        stats = Dog.get_meet_wins_and_dpc_wins_for_dog(cwa_number) 
        return jsonify({"ok": True, "data": stats}), 200

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500
