import sys
import os
import unittest
import random 

# Make backend/ importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import create_app

class TestAuthController(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app = create_app()
        app.testing = True
        cls.app = app
        print("\n" + "="*60)
        print("Starting Auth Controller Tests")
        print("="*60)

    def setUp(self):
        self.client = self.app.test_client()
        self.person_id = "testuser" + str(random.randint(0, 999999))        
        self.email = "brayden.campbell100@gmail.com"
        self.password = "dog12345"

    def tearDown(self):
        result = self._outcome.result
        test_name = self._testMethodName
        
        if hasattr(result, 'failures') and hasattr(result, 'errors'):
            failed = any(test_name in str(failure[0]) for failure in result.failures)
            errored = any(test_name in str(error[0]) for error in result.errors)
            
            if failed or errored:
                print(f"FAIL: {test_name}")
            else:
                print(f"PASS: {test_name}")

    def body(self, resp):
        return resp.get_data(as_text=True)

    def assert_status(self, resp, allowed):
        self.assertIn(resp.status_code, allowed, f"{resp.status_code} → {self.body(resp)}")

    def register(self):
        return self.client.post(
            "/api/auth/register",
            json={
                "personId": self.person_id,
                "firstName": "Test",
                "lastName": "User",
                "email": self.email,
                "addressLineOne": "123 Test St",
                "city": "Fayetteville",
                "stateProvince": "AR",
                "zipCode": "72701",
                "country": "US",
                "primaryPhone": "4795551234",
                "systemRole": "PUBLIC",
                "password": self.password,
            },
        )

    def login(self, password=None):
        return self.client.post(
            "/api/auth/login",
            json={
                "username": self.person_id,
                "password": password or self.password,
            },
        )

    def logout(self):
        return self.client.post("/api/auth/logout")

    #test registration functionality
    def test_01_register(self):
        """Test user registration"""
        r = self.register()
        self.assert_status(r, (200,201,))

    #test login functionality after registration
    def test_02_login(self):
        """Test user login after registration"""
        r1 = self.register()
        self.assert_status(r1, (200,201,))
        r2 = self.login()
        self.assert_status(r2, (200,201,))

    #test /me endpoint without login, should return user: None
    def test_03_me_requires_auth(self):
        """Test /me endpoint without authentication"""
        r = self.client.get("/api/auth/me")
        self.assert_status(r, (200,201,))
        self.assertIsNone(r.get_json()["user"])

    #test /me endpoint after login, should return user info with correct PersonID
    def test_04_me_after_login(self):
        """Test /me endpoint after login"""
        self.register()
        self.login()
        r = self.client.get("/api/auth/me")
        self.assert_status(r, (200,201,))
        user = r.get_json()["user"]
        self.assertIsNotNone(user)
        self.assertEqual(user["PersonID"], self.person_id)

    #test logout functionality
    def test_05_logout(self):
        """Test logout functionality"""
        self.register()
        self.login()
        r = self.logout()
        self.assert_status(r, (200,201,))
        r2 = self.client.get("/api/auth/me")
        self.assertIsNone(r2.get_json()["user"])

    #wrong password test
    def test_06_login_wrong_password(self):
        """Test login with wrong password"""
        self.register()
        r = self.login(password="WRONG")
        self.assert_status(r, (401,)) 

    @classmethod
    def tearDownClass(cls):
        print("\n" + "="*60)
        print("Auth Controller Tests Complete")
        print("="*60 + "\n")


if __name__ == "__main__":
    unittest.main(verbosity=1)
# docker compose -f docker-compose-dev.yml exec backend bash -lc "source venv/bin/activate && python test/test_auth.py"