from flask import Flask
from config import get_config
from router import register_routes
from utils.seed_user import seed_user

def create_app(config_name='development'):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(get_config())
    register_routes(app)
    return app

seed_user()
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)