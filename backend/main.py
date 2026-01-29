from flask import Flask
from flask_mail import Mail
from config import get_config
from router import register_routes
from migrate import run_migrations

def create_app(config_name='development'):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(get_config())
    mail.init_app(app)
    register_routes(app)
    return app

mail = Mail()
run_migrations()
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)