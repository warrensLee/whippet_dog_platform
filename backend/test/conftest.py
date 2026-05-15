from testcontainers.mysql import MySqlContainer
import pytest
import os
from main import create_app
from unittest.mock import patch

@pytest.fixture(scope="session")
def app():
    with MySqlContainer("mysql:8.0.44",dialect="pymysql", username="cwa", password="dogs", dbname="cwa_db", root_password="password", seed="../mysql/init") as container:
        os.environ["DB_HOST"] = "127.0.0.1"
        os.environ["DB_USER"] = "cwa"
        os.environ["DB_PORT"] = str(container.get_exposed_port(3306))
        os.environ["DB_PASSWORD"] = "dogs"
        os.environ["DB_NAME"] = "cwa_db"
        os.environ["SEED_ADMIN_FIRST_NAME"] = "root"
        os.environ["SEED_ADMIN_LAST_NAME"] = "admin"
        os.environ["SEED_ADMIN_EMAIL"] = "test@test.com"
        os.environ["CF_TURNSTILE_SECRET_KEY"] = "hi"
        os.environ["SEED_ADMIN_PASSWORD"] = "password"
        app = create_app()
        app.config.update({
            "TESTING": True,
        })
        app.config['SECRET_KEY'] = 'sekrit!'
        yield app



@pytest.fixture(scope="session")
def client(app):
    return app.test_client(use_cookies=True)

@pytest.fixture()
def admin_session(client):
    with client.session_transaction() as session:
        with patch("controller.authentication.validate_turnstile", return_value=True):
            response = client.post("/api/auth/login", json=dict(
                username= "test@test.com",
                password= "password",
                cf_token= "whatever"
            ))
        yield client  

    
