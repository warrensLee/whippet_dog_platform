from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.importer import CsvImporter
from classes.user_role import UserRole
from utils.auth_helpers import current_role, require_scope

import_bp = Blueprint("import_bp", __name__, url_prefix="/api/import")
importer = CsvImporter()

@import_bp.post("")
def import_csv():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    if "file" not in request.files:
        return jsonify({"ok": False, "error": "Missing file field 'file'"}), 400

    f = request.files["file"]
    if not f or not f.filename:
        return jsonify({"ok": False, "error": "No file uploaded"}), 400

    import_type = (request.args.get("type") or "dogs").strip().lower()
    mode = (request.args.get("mode") or "insert").strip().lower()

    if import_type == "dogs":
        deny = require_scope(role.edit_dog_scope, "import dogs")

    elif import_type == "meets":
        deny = require_scope(role.edit_meet_scope, "import meets")

    elif import_type == "meet_results":
        deny = require_scope(role.edit_meet_results_scope, "import meet results")

    elif import_type == "race_results":
        deny = require_scope(role.edit_race_results_scope, "import race results")
    
    elif import_type == "dog_owners":
        deny = require_scope(role.edit_dog_owner_scope, "import dog owners")

    #elif import_type == "dog_titles":
    #    deny = require_scope(role.edit_dog_title_scope, "import dog titles")

    elif import_type == "persons":
        deny = require_scope(role.edit_person_scope, "import persons")

    #elif import_type == "change_logs":
    #    deny = require_scope(role.edit_change_log_scope, "import change logs")

    elif import_type == "title_types":
        deny = require_scope(role.edit_title_type_scope, "import title types")

    elif import_type == "user_roles":
        deny = require_scope(role.edit_user_role_scope, "import user roles")

    else:
        return jsonify({"ok": False, "error": "Invalid import type"}), 400

    if deny:
        return deny
    
    if ((import_type == "dogs" and role.edit_dog_scope != UserRole.ALL)
            or (import_type == "meets" and role.edit_meet_scope != UserRole.ALL)
            or (import_type == "meet_results" and role.edit_meet_results_scope != UserRole.ALL)
            or (import_type == "race_results" and role.edit_race_results_scope != UserRole.ALL)
            or (import_type == "dog_owners" and role.edit_dog_owner_scope != UserRole.ALL)
            #or (import_type == "dog_titles" and role.edit_dog_title_scope != UserRole.ALL)
            or (import_type == "persons" and role.edit_person_scope != UserRole.ALL)
            #or (import_type == "change_logs" and role.edit_change_log_scope != UserRole.ALL)
            or (import_type == "title_types" and role.edit_title_type_scope != UserRole.ALL)
            or (import_type == "user_roles" and role.edit_user_role_scope != UserRole.ALL)
        ):
        return jsonify({
            "ok": False,
            "error": "Importer requires ALL scope"
        }), 403

    if mode not in ("insert", "update"):
        return jsonify({"ok": False, "error": "mode must be 'insert' or 'update'"}), 400

    try:
        report = importer.run(
            f,
            import_type=import_type,
            mode=mode,
        )
        return jsonify({"ok": True, "report": report}), 200

    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400

    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@import_bp.get("/types")
def get_import_types():
    return jsonify({
        "ok": True,
        "import_types": ["dogs", "meets", "meet_results", "race_results", "dog_owners", "dog_titles", "persons", "change_logs", "title_types", "user_roles"],
    }), 200