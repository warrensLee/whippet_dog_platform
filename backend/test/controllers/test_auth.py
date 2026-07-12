from unittest.mock import patch
from classes.registration_invite import RegistrationInvite
import database
import pytest
import secrets
from datetime import datetime, timedelta, timezone
from classes.person import Person
def test_login_wrong_password(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "test@test.com",
            "password": "passwordsdfe",
            "cf_token": "whatever"

        })
        assert response.status_code == 401 
        assert not response.json["ok"]

def test_login_wrong_username(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "test@test.comsdf",
            "password": "password",
            "cf_token": "whatever"

        })
        assert response.status_code == 401 
        assert not response.json["ok"]


def test_login_bad_turnstile(client):
    with patch("controller.authentication.validate_turnstile", return_value=False):
        response = client.post("/api/auth/login", json={
            "username": "test@test.com",
            "password": "password",
            "cf_token": "whatever"

        })
        assert response.status_code == 400 
        assert not response.json["ok"]

def test_login_success(client):
    print(Person.list_all_persons()[0].email)
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "test@test.com",
            "password": "password",
            "cf_token": "whatever"

        })
        assert response.status_code == 200 
        assert response.json["ok"]
        assert response.headers["Set-Cookie"] is not None

def test_login_no_turnstile(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "test@test.com",
            "password": "password",
        })
        assert response.status_code == 400 
        assert not response.json["ok"] 

def test_login_no_username(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "password": "password",
            "cf_token": "whatever"
        })
        assert response.status_code == 400 
        assert not response.json["ok"]

def test_login_with_username(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "admin@",
            "password": "password",
            "cf_token": "whatever"
        })
        assert response.status_code == 401
        assert not response.json["ok"]

def test_login_locked(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        admin = Person.find_by_email("test@test.com")
        admin.locked = True
        admin.update()
        response = client.post("/api/auth/login", json={
            "username": "admin",
            "password": "password",
            "cf_token": "whatever"
        })
        assert response.status_code == 403
        assert not response.json["ok"]
        admin.locked = False
        admin.update()

def test_login_no_password(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "test@test.com",
            "cf_token": "whatever"
        })
        print(response.json)
        assert response.status_code == 400
        assert "Set-Cookie" not in response.headers
        assert not response.json["ok"]


@pytest.fixture
def invite_token():
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=2)
    invite = RegistrationInvite.create(
        email="test2@test2.com",
        token=token,
        expires_at=expires_at,
        created_by=1
    )
    yield invite
    database.execute("DELETE FROM RegistrationInvite WHERE token=%s", (token,))



def test_register_no_token(client):
    response = client.post("/api/auth/register", json={
        "personId": "hiii",
        "last_name": "test",
        "email": "test2@test2.com",
        "firstName": "creation",
        "lastName": "test",
    })
    assert response.status_code == 400

def test_register_bad_token(client):
    response = client.post("/api/auth/register", json={
        "personId": "hiii",
        "last_name": "test",
        "email": "test2@test2.com",
        "firstName": "creation",
        "lastName": "test",
        "token": "badtoken"
    })
    assert response.status_code == 400

def test_register_no_password(client,invite_token):
    response = client.post("/api/auth/register", json={
        "personId": "hi",
        "last_name": "test",
        "email": "test2@test2.com",
        "firstName": "creation",
        "lastName": "test",
        "token": invite_token.token
    })
    assert response.status_code == 400
    assert response.json["error"] == "Password is required"

def test_register_no_email(client, invite_token):
    response = client.post("/api/auth/register", json={
        "personId": "hi",
        "last_name": "test",
        "firstName": "creation",
        "lastName": "test",
        "password": "password",
        "token": invite_token.token
    })
    assert response.status_code == 400
    assert response.json["error"] == "Email is required"

def test_register_mismatched_email(client,invite_token):
    response = client.post("/api/auth/register", json={
        "personId": "hi",
        "last_name": "test",
        "email": "test2@test.com",
        "firstName": "creation",
        "password": "password",
        "lastName": "test",
        "token": invite_token.token
    })
    assert response.status_code == 400
    assert response.json["error"] == "Email does not match invite"

def test_register_username_already_exists(client,invite_token):
    response = client.post("/api/auth/register", json={
        "personId": "admin",
        "last_name": "test",
        "email": "test2@test2.com",
        "firstName": "creation",
        "password": "password",
        "lastName": "test",
        "token": invite_token.token
    })
    assert response.status_code == 409
    assert response.json["error"] == "Username already exists"

def test_register_ok(client,invite_token):
    response = client.post("/api/auth/register", json={
        "personId": "hiii",
        "last_name": "test",
        "email": "test2@test2.com",
        "firstName": "creation",
        "password": "password",
        "lastName": "test",
        "token": invite_token.token
    })
    assert response.status_code == 201
    database.execute("DELETE FROM Person WHERE EmailAddress=%s",("test2@test2.com",))


@pytest.fixture
def claim_dummy_token():
    dummy = Person(2,"test2", "test3", "test4", "test2@test2.com","","","","","","","","","PUBLIC","","","",False,1,datetime.now())
    dummy.validate()
    dummy.save()
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=2)
    RegistrationInvite.create(
        email="test2@test2.com",
        token=token,
        expires_at=expires_at,
        created_by=1,
        person_id=dummy.id
    )
    yield token
    database.execute("DELETE FROM ChangeLog WHERE ChangedBy=%s",(dummy.id,))
    database.execute("DELETE FROM Person WHERE EmailAddress=%s",("test2@test2.com",))
    database.execute("DELETE FROM RegistrationInvite WHERE token=%s", (token,))



def test_register_dummy_user(client, claim_dummy_token):
    response = client.post("/api/auth/register", json={
        "personId": "hiii",
        "last_name": "test",
        "email": "test2@test2.com",
        "firstName": "creation",
        "password": "password",
        "lastName": "test",
        "token": claim_dummy_token 
    })
    assert response.status_code == 200

def test_register_dummy_existing_username(client, claim_dummy_token):
    response = client.post("/api/auth/register", json={
        "personId": "admin",
        "email": "test2@test2.com",
        "firstName": "creation",
        "password": "password",
        "lastName": "test",
        "token": claim_dummy_token 
    })
    assert response.status_code == 409
    assert response.json["error"] == "Username already exists"

def test_register_dummy_invalid_person(client, claim_dummy_token):
    response = client.post("/api/auth/register", json={
        "personId": "test214",
        "lastName": 'test',
        "email": "test2@test2.com",
        "firstName": "creation"*50,
        "password": "password",
        "token": claim_dummy_token 
    })
    assert response.status_code == 400

def test_check_email_invalid_email(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.get("/api/auth/check_email?token=whatever&email=fake@email.com")
        print(response)
        assert response.status_code == 200
        assert not response.json["valid"]
        assert response.json["message"] == "This email is not approved or has already registered"

def test_check_email_existing_user(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.get("/api/auth/check_email?token=whatever&email=test@test.com")
        print(response)
        assert response.status_code == 200
        assert not response.json["valid"]
        assert response.json["message"] == "This email is not approved or has already registered"

def test_check_email_no_email(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.get("/api/auth/check_email?token=whatever")
        print(response)
        assert response.status_code == 200
        assert not response.json["valid"] 
        assert response.json["message"] == "No email entered"

def test_check_email_no_token(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.get("/api/auth/check_email?email=hi@hi.com")
        print(response)
        assert response.status_code == 200
        assert not response.json["valid"]
        assert response.json["message"] == "Invalid or no Turnstile token"

def test_check_email_invalid_token(client):
    with patch("controller.authentication.validate_turnstile", return_value=False):
        response = client.get("/api/auth/check_email?email=hi@hi.com&token=whatever")
        print(response)
        assert response.status_code == 200
        assert not response.json["valid"]
        assert response.json["message"] == "Invalid or no Turnstile token"

def test_check_email_success(client, create_dummy_account):
    create_dummy_account("test2@test2.com") 
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.get("/api/auth/check_email?email=test2@test2.com&token=whatever")
        assert response.status_code == 200
        assert response.json["valid"]
        token = response.json["token"]
        assert token is not None
        assert RegistrationInvite.find_valid(token) is not None

