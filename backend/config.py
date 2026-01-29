import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    
    # Email configuration
    MAIL_SERVER = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("SMTP_PORT", "587"))
    MAIL_USERNAME = os.environ.get("SMTP_USER", "")
    MAIL_PASSWORD = os.environ.get("SMTP_PASS", "")
    MAIL_DEFAULT_SENDER = os.environ.get("FROM_EMAIL", os.environ.get("SMTP_USER", ""))
    CONTACT_TO_EMAIL = os.environ.get("CONTACT_TO_EMAIL", "your-email@example.com")

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
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config_by_name.get(env, DevelopmentConfig)