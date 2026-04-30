from flask import jsonify
import logging

logger = logging.getLogger(__name__)


def handle_error(e, error_type="Server error"):
    """
    handles errors in the appllications and generates a proper flask response 
    """
    logger.exception(f"{error_type}: {str(e)}")
    return jsonify({"ok": False, "error": "Internal Server Error"}), 500
