from flask import jsonify

def handle_error(e, error_type="Server error"):
    """
    handles errors in the appllications and generates a proper flask response 
    """
    print(f"{error_type}: {str(e)}")
    return jsonify({"ok": False, "error": "Internal Server Error"}), 500
