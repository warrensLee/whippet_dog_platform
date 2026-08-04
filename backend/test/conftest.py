from testcontainers.mysql import MySqlContainer
import pytest
import os
from main import create_app
from unittest.mock import patch
from classes.person import Person
from classes.user_role import UserRole
from classes.dog import Dog
import string
import random
from classes.change_log import ChangeLog


def randomword():
   letters = string.ascii_lowercase
   return ''.join(random.choice(letters) for i in range(10))

@pytest.fixture(scope="session")
def app():
    with MySqlContainer("mysql:8.0.44",dialect="pymysql", username="cwa", password="dogs", dbname="cwa_db", root_password="password", seed="../mysql/init") as container:
        print(container)
        os.environ["DB_HOST"] = "127.0.0.1"
        os.environ["DB_USER"] = "cwa"
        os.environ["DB_PORT"] = str(container.get_exposed_port(3306))
        os.environ["DB_PASSWORD"] = "dogs"
        os.environ["DB_NAME"] = "cwa_db"
        os.environ["SEED_ADMIN_FIRST_NAME"] = "root"
        os.environ["SEED_ADMIN_LAST_NAME"] = "admin"
        os.environ["SEED_ADMIN_ID"] = "admin"
        os.environ["SEED_ADMIN_EMAIL"] = "test@test.com"
        os.environ["CF_TURNSTILE_SECRET_KEY"] = "hi"
        os.environ["SEED_ADMIN_PASSWORD"] = "password"
        app = create_app()
        app.config.update({
            "TESTING": True,
        })
        app.config['SECRET_KEY'] = 'sekrit!'
        yield app



@pytest.fixture()
def client(app):
    return app.test_client(use_cookies=True)

@pytest.fixture
def admin_session(client):
    with client.session_transaction():
        with patch("controller.authentication.validate_turnstile", return_value=True):
            client.post("/api/auth/login", json=dict(
                username= "test@test.com",
                password= "password",
                cf_token= "whatever"
            ))
        yield client  

@pytest.fixture
def create_dummy_account():
    created_accounts = []
    def _create_dummy_account(email):
        account = Person(None, None, "test", "test", email, None, None, None, None, None, None, None, None, "ADMIN", None, None, None, False)
        account.save()
        created_accounts.append(account.id)
        return  account
    yield _create_dummy_account
    for x in created_accounts:
        Person.find_by_id(x).delete()


@pytest.fixture
def public_user():
    user = Person("9","public_test","test123", "test456", "public_1@test3.com","","","","","","","","","PUBLIC","","","",False)
    user.set_password("test")
    user.save()
    yield user
    user.delete()

@pytest.fixture
def public_user_session(client, public_user):
    with client.session_transaction():
        with patch("controller.authentication.validate_turnstile", return_value=True):
            client.post("/api/auth/login", json=dict(
                username= "public_1@test3.com",
                password= "test",
                cf_token= "whatever"
            ))
        yield client

@pytest.fixture
def privileged_client_factory(app):
    created_user_roles = []
    created_people = []
    def get_privileged_client(edit_dog_scope=0, edit_meet_scope=0, edit_title_type_scope=0):
        user_role = UserRole(randomword(), edit_dog_scope=edit_dog_scope, edit_meet_scope=edit_meet_scope,edit_title_type_scope=edit_title_type_scope)
        user_role.save()
        user = Person(None,randomword(),"test123", "test456", randomword() + "@test3.com","","","","","","","","",user_role.title,"","","",False)
        user.set_password("test")
        user.save()
        created_user_roles.append(user_role)
        created_people.append(user)
        client = app.test_client(use_cookies=True)
        with client.session_transaction():
            with patch("controller.authentication.validate_turnstile", return_value=True):
                client.post("/api/auth/login", json=dict(
                    username= user.email,
                    password= "test",
                    cf_token= "whatever"
                ))
        return client

    yield get_privileged_client

    for x in created_people:
        for y in ChangeLog.list_for_user(x.id):
            ChangeLog.delete(y.id)
        x.delete()

    for x in created_user_roles:
        x.delete_by_id()


@pytest.fixture
def all_privileges_user():
    user_role = UserRole("ALL", edit_dog_scope=2, edit_meet_scope=2,edit_title_type_scope=2)
    user_role.save()
    user = Person("10","all_test","test123", "test456", "all_1@test3.com","","","","","","","","","ALL","","","",False)
    user.set_password("test")
    user.save()
    yield user
    user.delete()
    user_role.delete_by_id()

@pytest.fixture
def all_privileges_session(client, all_privileges_user):
    with client.session_transaction():
        with patch("controller.authentication.validate_turnstile", return_value=True):
            login_response = client.post("/api/auth/login", json=dict(
                username= "all_1@test3.com",
                password= "test",
                cf_token= "whatever"
            ))
            assert login_response.status_code == 200
        yield client

@pytest.fixture
def dog_factory():
    created_dogs = []
    cwa_counter = 1111 
    def _create_dog():
        nonlocal cwa_counter
        d = Dog(str(cwa_counter),"0","AKC","TEST","TESTINGTON", "1912-12-12","","ACTIVE",87,"D",10,12,12,12,5,12,12,12,12,"","","","","",False)
        d.save()
        created_dogs.append(cwa_counter)
        cwa_counter += 1 
        return d
    yield _create_dog
    for x in created_dogs:
        Dog.delete(x)