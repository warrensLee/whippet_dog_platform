import requests
import os

def validate_turnstile(token, remoteip=None):
    url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    print("Validating turnstile")
    data = {
        'secret': os.environ["CF_TURNSTILE_SECRET_KEY"],
        'response': token
    }

    if remoteip:
        data['remoteip'] = remoteip

    try:
        response = requests.post(url, data=data, timeout=10)
        response.raise_for_status()
        response_data = response.json()
        if not response_data["success"]:
            return False;
        return True
    except requests.RequestException as e:
        print(f"Turnstile validation error: {e}")
        return False