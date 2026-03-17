import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
    FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@example.com")
    CONTACT_TO_EMAIL = os.environ.get("CONTACT_TO_EMAIL", "")

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True

config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.environ.get("FLASK_ENV", "development")
    return config_by_name.get(env, DevelopmentConfig)