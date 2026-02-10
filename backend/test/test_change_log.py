import sys
import os
import unittest
import random
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import create_app

class TestChangeLogController(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app = create_app()
        app.testing = True
        cls.app = app

        print("\n" + "="*60)
        print("Starting Change Log Controller Tests")
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
                "password":self.password,
            },
        )
    
    def login(self):
        return self.client.post(
            "/api/auth/login",
            json={"username": self.person_id, "password": self.password},
        )

    # ---------- tests ----------
    # to test 2 and 3, toggle view_change_log_scope between ALL, SELF, and NONE
    # has to log in to get change log permissions, so we test that first
    def test_01_requires_login(self):
        r1 = self.register()
        self.assert_status(r1, (200,201))
        r2 = self.client.get("/api/change_log/get")
        self.assert_status(r2, (401,)) # 401 if not signged in

    #test login and then list change logs, which may or may not be allowed depending on PUBLIC role configuration
    def test_02_list_change_logs(self):
        r1 = self.register()
        self.assert_status(r1, (200, 201,))
        r2 = self.login()
        self.assert_status(r2, (200, 201,))

        r = self.client.get("/api/change_log/get")

        # Authorization behavior for Change Log access (PUBLIC role):
        # - 200 OK: 
        #     * view_change_log_scope == ALL, or
        #     * view_change_log_scope == SELF and the user has change-log entries authored by them
        # - 403 Forbidden:
        #     * view_change_log_scope == NONE
        payload = r.get_json(silent=True)
        print("JSON PAYLOAD:", json.dumps(payload, indent=2, default=str))
        if r.status_code == 200:
            data = r.get_json(silent=True) or {}
            self.assertTrue(data.get("ok") is True, self.body(r))
            self.assertIsInstance(data.get("data"), list, self.body(r))
        self.assert_status(r, (200,403,))


    def test_03_get_single_change_log(self):
        r1 = self.register()
        self.assert_status(r1, (200, 201,))
        r2 = self.login()
        self.assert_status(r2, (200, 201,))

        r = self.client.get("/api/change_log/get")
        self.assert_status(r, (200, 403))


        if r.status_code == 403:
            return

        payload = r.get_json(silent=True) or {}
        print("JSON PAYLOAD:", json.dumps(payload, indent=2, default=str))
        rows = payload.get("data") or []
        self.assertTrue(len(rows) > 0, f"No change logs returned: {self.body(r)}")

        first_id = rows[0].get("id")
        self.assertIsNotNone(first_id, f"Could not find id field in: {rows[0]}")

        one = self.client.get(f"/api/change_log/get/{first_id}")
        self.assert_status(one, (200, 403, 404))

        if one.status_code == 200:
            obj = (one.get_json(silent=True) or {}).get("data") or {}
            self.assertTrue(obj, f"Missing data object: {self.body(one)}")

    @classmethod
    def tearDownClass(cls):
        print("\n" + "="*60)
        print("Change Log Controller Tests Complete")
        print("="*60 + "\n")


if __name__ == "__main__":
    unittest.main(verbosity=2, buffer=False)
# docker compose -f docker-compose-dev.yml exec backend bash -lc "source venv/bin/activate && python test/test_change_log.py"
