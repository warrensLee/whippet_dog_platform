from flask import Blueprint, jsonify, request
from mysql.connector import Error
from backend.classes.importer import CsvImporter
from backend.utils.auth_helpers import current_role, require_admin
from backend.utils.error_handler import handle_error

import_bp = Blueprint("import_bp", __name__, url_prefix="/api/import")
importer = CsvImporter()

@import_bp.post("")
@require_admin
def import_csv():
    if "file" not in request.files:
        return jsonify({"ok": False, "error": "Missing file field 'file'"}), 400

    f = request.files["file"]
    if not f or not f.filename:
        return jsonify({"ok": False, "error": "No file uploaded"}), 400

    import_type = (request.args.get("type") or "dogs").strip().lower()
    mode = (request.args.get("mode") or "insert").strip().lower()
    use_adjustment = request.args.get("useAdjustment", "false").strip().lower() == "true"

    if mode not in ("insert", "update"):
        return jsonify({"ok": False, "error": "mode must be 'insert' or 'update'"}), 400

    try:
        report = importer.run(
            f,
            import_type=import_type,
            mode=mode,
            use_adjustment=use_adjustment,
        )
        return jsonify({"ok": True, "report": report}), 200

    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400

    except Error as e:
        return handle_error(e, "Database error")

    except Exception as e:
        return handle_error(e, "Server error")

@import_bp.get("/types")
def get_import_types():
    return jsonify({
        "ok": True,
        "import_types": ["dogs", "meets", "meet_results", "race_results", "dog_owners", "dog_titles", "persons", "change_logs", "title_types", "user_roles"],
    }), 200