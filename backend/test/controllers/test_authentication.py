from unittest.mock import patch

def test_login_wrong_password(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "test@test.com",
            "password": "passwordsdfe",
            "cf_token": "whatever"

        })
        assert response.status_code == 401 
        assert response.json["ok"] == False

def test_login_wrong_username(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "test@test.comsdf",
            "password": "password",
            "cf_token": "whatever"

        })
        assert response.status_code == 401 
        assert response.json["ok"] == False

def test_login_bad_turnstile(client):
    with patch("controller.authentication.validate_turnstile", return_value=False):
        response = client.post("/api/auth/login", json={
            "username": "test@test.com",
            "password": "password",
            "cf_token": "whatever"

        })
        assert response.status_code == 400 
        assert response.json["ok"] == False


def test_login_no_turnstile(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "test@test.com",
            "password": "password",
        })
        assert response.status_code == 400 
        assert response.json["ok"] == False

def test_login_no_username(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "password": "password",
            "cf_token": "whatever"
        })
        print(response.data)
        assert response.status_code == 400 
        assert response.json["ok"] == False

def test_login_no_password(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "password",
            "cf_token": "whatever"
        })
        assert response.status_code == 400 
        assert response.json["ok"] == False

def test_login_no_password(client):
    with patch("controller.authentication.validate_turnstile", return_value=True):
        response = client.post("/api/auth/login", json={
            "username": "test@test.com",
            "password": "password",
            "cf_token": "whatever"
        })
        assert response.status_code == 200 
        assert response.headers["Set-Cookie"] is not None
        assert response.json["ok"] == True 