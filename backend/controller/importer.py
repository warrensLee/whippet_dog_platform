from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.importer import CsvImporter
from utils.auth_helpers import current_role, require_scope

import_bp = Blueprint("import_bp", __name__, url_prefix="/api/import")
importer = CsvImporter()

@import_bp.post("")
def import_csv():
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = require_scope(role.edit_dog_scope, "import dogs")
    if deny:
        return deny

    if "file" not in request.files:
        return jsonify({"ok": False, "error": "Missing file field 'file'"}), 400

    f = request.files["file"]
    if not f or not f.filename:
        return jsonify({"ok": False, "error": "No file uploaded"}), 400

    import_type = (request.args.get("type") or "").strip().lower() or None
    mode = (request.args.get("mode") or "insert").strip().lower()

    if (import_type in (None, "dogs")) and mode not in ("insert", "upsert"):
        return jsonify({"ok": False, "error": "mode must be 'insert' or 'upsert'"}), 400

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
