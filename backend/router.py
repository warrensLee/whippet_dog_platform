
from flask import Blueprint, jsonify
from database import fetch_all, fetch_one
from controller.authentication import auth_bp
from controller.contact import contact_bp


api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.get("/tables")
def tables():
    """Get all database tables"""
    rows = fetch_all("SHOW TABLES")
    return jsonify(rows)

# You can add more API routes here
# Example:
# @api_bp.get("/users")
# def get_users():
#     users = fetch_all("SELECT * FROM users")
#     return jsonify(users)

# Create a blueprint for general routes

main_bp = Blueprint('main', __name__)

@main_bp.get("/health")
def health():
    """Health check endpoint"""
    return "OK", 200

def register_routes(app):
    """Register all blueprints with the Flask app"""
    app.register_blueprint(auth_bp)
    app.register_blueprint(contact_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(main_bp)