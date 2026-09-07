from flask import Flask
from backend.config import get_config
from backend.router import register_routes
from backend.utils.seed_user import seed_user
import os

def create_app(config_name='development'):
    """Application factory pattern"""
    app = Flask(__name__)
    seed_user()
    app.config.from_object(get_config())
    register_routes(app)
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8000, debug=os.getenv("FLASK_DEBUGGER") == "TRUE")