from unittest.mock import patch
from classes.registration_invite import RegistrationInvite
import database
import pytest
from classes.password_reset import PasswordResetToken
import secrets
from datetime import datetime, timedelta, timezone
from classes.person import Person

'''
-------------------
| /api/auth/login |
-------------------
'''

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

'''
----------------------
| /api/auth/register |
----------------------
'''

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

def test_register_invalid_email(client,invite_token):
    response = client.post("/api/auth/register", json={
        "personId": "hi",
        "last_name": "test",
        "email": "test2sldkjf",
        "firstName": "creation",
        "password": "password",
        "lastName": "test",
        "token": invite_token.token
    })
    assert response.status_code == 400
    assert response.json["error"] == "Invalid email address"

def test_register_person_validation(client,invite_token):
    response = client.post("/api/auth/register", json={
        "personId": "hi",
        "last_name": "test"*50,
        "email": "test@sdfl.com",
        "firstName": "creation",
        "password": "password",
        "lastName": "test",
        "token": invite_token.token
    })
    assert response.status_code == 400
    assert response.json["error"] is not None

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

'''
----------------------
| /api/auth/register |
----------------------
'''

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

'''
-------------------------
| /api/auth/check_email |
-------------------------
'''

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

'''
----------------
| /api/auth/me |
----------------
'''

def test_me_not_logged_in(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json["ok"]
    assert response.json["user"] == None

def test_me_admin(admin_session):
    response = admin_session.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json["ok"]
    assert response.json["user"]["PersonID"] == "admin"
    assert response.json["user"]["role"]["title"] == "ADMIN"
    assert response.json["user"]["role"]["editDogScope"] == 2
    assert response.json["user"]["role"]["editMeetScope"] == 2
    assert response.json["user"]["role"]["editTitleTypeScope"] == 2
    assert response.json["signedIn"]
    assert response.json["canManageDogs"]

'''
-----------------------------
| /api/auth/change-password |
-----------------------------
'''

def test_change_password_ok(public_user_session):
    response = public_user_session.post("/api/auth/change-password", json={
        "password":"test",
        "new_password":"Password123!"
    })
    assert response.status_code == 200
    assert response.json["ok"]
    assert Person.find_by_identifier("public_test").check_password("Password123!")

def test_change_password_wrong_current(public_user_session):
    response = public_user_session.post("/api/auth/change-password", json={
        "password":"wrong",
        "new_password":"Password123!"
    })
    assert response.status_code == 200
    assert response.json["ok"] == False
    assert response.json["error"] == "Current Password is incorrect"

def test_change_password_not_logged_in(client):
    response = client.post("/api/auth/change-password", json={
        "password":"test",
        "new_password":"Password123!"
    })
    assert response.status_code == 200
    assert response.json["ok"] == False
    assert response.json["error"] == "User not found"


def test_change_password_no_password(client):
    response = client.post("/api/auth/change-password", json={
        "new_password":"Password123!"
    })
    assert response.status_code == 200
    assert response.json["ok"] == False
    assert response.json["error"] == "Missing password or new password"


def test_change_password_no_password(client):
    response = client.post("/api/auth/change-password", json={
        "password":"Password123!"
    })
    assert response.status_code == 200
    assert response.json["ok"] == False
    assert response.json["error"] == "Missing password or new password"

'''
----------------------------
| /api/auth/reset-password |
----------------------------
'''

def test_reset_password_no_email(client):
    response = client.post("/api/auth/reset-password", json={"token": "invalid"})
    assert response.status_code == 400
    assert response.json["ok"] == False
    assert response.json["error"] == "Missing token or password"

def test_reset_password_no_token(client):
    response = client.post("/api/auth/reset-password", json={"password": "invalid"})
    assert response.status_code == 400
    assert response.json["ok"] == False
    assert response.json["error"] == "Missing token or password"

def test_reset_password_invalid_token(client):
    response = client.post("/api/auth/reset-password", json={"password": "invalid", "token": "invalid"})
    assert response.status_code == 400
    assert response.json["ok"] == False
    assert response.json["error"] == "Invalid or expired token"

def test_reset_password_expired_token(client, public_user):
    token = PasswordResetToken.create(public_user.id,"test",datetime(2000,1,1))
    response = client.post("/api/auth/reset-password", json={"password": "invalid", "token": "test"})
    assert response.status_code == 400
    assert response.json["ok"] == False
    assert response.json["error"] == "Invalid or expired token"
    token.delete()

def test_reset_password_ok(client, public_user):
    token = PasswordResetToken.create(public_user.id,"test", datetime(2300,1,1))
    response = client.post("/api/auth/reset-password", json={"password": "invalid", "token": "test"})
    assert response.status_code == 200
    assert response.json["ok"]
    token.delete()

'''
-----------------------------
| /api/auth/forgot-password |
-----------------------------
'''

def test_forgot_password_no_token(client):
    with patch("utils.email_service.send_reset_email", return_value=None):
        with patch("controller.authentication.validate_turnstile", return_value=True):
            response = client.post("/api/auth/forgot-password", json={"identifier": "test@test.com"})
            assert response.status_code == 400
            assert response.json["ok"] == False
            assert response.json["message"] == "Security Token is missing"

def test_forgot_password_invalid_token(client):
    with patch("utils.email_service.send_reset_email", return_value=None):
        with patch("controller.authentication.validate_turnstile", return_value=False):
            response = client.post("/api/auth/forgot-password", json={"identifier": "test@test.com", "cf_token":"invalid"})
            assert response.status_code == 400
            assert response.json["ok"] == False
            assert response.json["message"] == "Invalid/Expired Security Token. Please Try Again"

def test_forgot_password_no_identifier(client):
    with patch("controller.authentication.send_reset_email", return_value=None):
        with patch("controller.authentication.validate_turnstile", return_value=True):
            response = client.post("/api/auth/forgot-password", json={"cf_token":"valid"})
            assert response.status_code == 200
            assert response.json["ok"] == True
            assert response.json["message"] == "If an account exists, a password reset email has been sent."

def test_forgot_password_invalid_identifier(client):
    with patch("controller.authentication.send_reset_email", return_value=None):
        with patch("controller.authentication.validate_turnstile", return_value=True):
            response = client.post("/api/auth/forgot-password", json={"identifier":"no", "cf_token":"valid"})
            assert response.status_code == 200
            assert response.json["ok"] == True
            assert response.json["message"] == "If an account exists, a password reset email has been sent."

def test_forgot_password_ok(client):
    with patch("controller.authentication.send_reset_email", return_value=None):
        with patch("controller.authentication.validate_turnstile", return_value=True):
            response = client.post("/api/auth/forgot-password", json={"identifier":"test@test.com", "cf_token":"valid"})
            assert response.status_code == 200
            assert response.json["ok"] == True
            assert response.json["message"] == "If an account exists, a password reset email has been sent."
            assert database.fetch_one("SELECT * FROM PasswordResetToken WHERE PersonID=1") is not None
            database.execute("DELETE FROM PasswordResetToken;")


'''
--------------------
| /api/auth/invite |
--------------------
'''

def test_invite_not_logged_in(client):
    response = client.post("/api/auth/invite", json={"email":"test2@test2.com"})
    assert response.status_code == 401
    assert response.json["ok"] == False
    assert response.json["error"] == "Not signed in"

def test_invite_not_admin(all_privileges_session):
    response = all_privileges_session.post("/api/auth/invite", json={"email":"test2@test2.com"})
    assert response.status_code == 403
    assert response.json["ok"] == False
    assert response.json["error"] == "Not authorized"

def test_invite_no_email(admin_session): 
    response = admin_session.post("/api/auth/invite", json={})
    assert response.status_code == 400
    assert response.json["ok"] == False
    assert response.json["error"] == "Email is required"

def test_invite_invalid_email(admin_session): 
    response = admin_session.post("/api/auth/invite", json={"email":"invalidemail"})
    assert response.status_code == 400
    assert response.json["ok"] == False
    assert response.json["error"] == "Invalid email address: An email address must have an @-sign."

def test_invite_ok(admin_session): 
    with patch("controller.authentication.send_invite_email"):
        response = admin_session.post("/api/auth/invite", json={"email":"test@invite.com"})
        assert response.status_code == 200
        assert response.json["ok"] == True
        assert database.fetch_one("SELECT * FROM RegistrationInvite WHERE email='test@invite.com'") is not None

'''
--------------------
| /api/auth/logout |
--------------------
'''
def test_logout(public_user_session):
    response = public_user_session.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.headers["set-cookie"] is not None


'''
--------------------------------
| /api/auth/invite-claim-dummy |
--------------------------------
'''
def test_invite_claim_dummy_not_logged_in(client):
    response = client.post("/api/auth/invite-claim-dummy", json={"email":"testsdf@fsdfes.com", "id":"1"})
    assert response.status_code == 401
    assert response.json["ok"] == False
    assert response.json["error"] == "Not signed in"

def test_invite_claim_dummy_not_admin(all_privileges_session):
    response = all_privileges_session.post("/api/auth/invite-claim-dummy", json={"email":"testsdf@fsdfes.com", "id":"1"})
    assert response.status_code == 403
    assert response.json["ok"] == False
    assert response.json["error"] == "Not authorized"

def test_invite_claim_dummy_no_email(admin_session):
    response = admin_session.post("/api/auth/invite-claim-dummy", json={"id":"testsdf@fsdfes.com"})
    assert response.status_code == 400
    assert response.json["ok"] == False
    assert response.json["error"] == "Email is required"

def test_invite_claim_dummy_no_id(admin_session):
    response = admin_session.post("/api/auth/invite-claim-dummy", json={"email":"testsdf@fsdfes.com"})
    assert response.status_code == 400
    assert response.json["ok"] == False
    assert response.json["error"] == "ID is required"

def test_invite_claim_dummy_bad_id(admin_session):
    response = admin_session.post("/api/auth/invite-claim-dummy", json={"email":"testsdf@fsdfes.com", "id":"1234124"})
    assert response.status_code == 404
    assert response.json["ok"] == False
    assert response.json["error"] == "Person does not exist"

def test_invite_claim_dummy_ok(admin_session):
    with patch("controller.authentication.send_invite_email"):
        dummy = Person(None,"test_dummy","Dummy","McTest","test32@test64.com","","","","","","","","","PUBLIC","","","",False)
        dummy.save()
        response = admin_session.post("/api/auth/invite-claim-dummy", json={"email":"test@dummyinvite.com", "id":dummy.id})
        assert response.status_code ==200 
        assert response.json["ok"]
        assert database.fetch_one("SELECT * FROM RegistrationInvite WHERE email='test@dummyinvite.com' AND PersonID=%s", (dummy.id,)) is not None
        dummy.delete()