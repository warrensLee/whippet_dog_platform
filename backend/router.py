
from flask import Blueprint, jsonify
from database import fetch_all, fetch_one
from controller.authentication import auth_bp
from controller.dog import dog_bp
from controller.contact import contact_bp
from controller.officer_role import officer_role_bp
from controller.club import club_bp
from controller.news import news_bp
from controller.person import person_bp
from controller.user_role import user_role_bp
from controller.change_log import change_log_bp


api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.get("/tables")
def tables():
    """Get all database tables"""
    rows = fetch_all("SHOW TABLES")
    return jsonify(rows)

main_bp = Blueprint('main', __name__)

@main_bp.get("/health")
def health():
    """Health check endpoint"""
    return "OK", 200

def register_routes(app):
    """Register all blueprints with the Flask app"""
    app.register_blueprint(auth_bp)
    app.register_blueprint(dog_bp)
    app.register_blueprint(contact_bp)
    app.register_blueprint(officer_role_bp)
    app.register_blueprint(club_bp)
    app.register_blueprint(person_bp)
    app.register_blueprint(user_role_bp)
    app.register_blueprint(change_log_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(main_bp)