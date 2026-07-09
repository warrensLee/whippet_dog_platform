import os

def test_health(client):
    response = client.get("/api/health")
    assert b"OK" in response.data


def test_turnstile(client):
    os.environ["CF_TURNSTILE_SITE_KEY"] = "HELLO"
    response = client.get("/api/turnstile")
    assert b"HELLO" in response.data