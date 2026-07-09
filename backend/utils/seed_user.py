import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from classes.person import Person



def seed_user():
    PERSON_ID = os.getenv("SEED_ADMIN_ID")
    FIRST_NAME = os.getenv("SEED_ADMIN_FIRST_NAME")
    LAST_NAME = os.getenv("SEED_ADMIN_LAST_NAME")
    EMAIL = os.getenv("SEED_ADMIN_EMAIL")
    PASSWORD = os.getenv("SEED_ADMIN_PASSWORD")
    SYSTEM_ROLE = os.getenv("SEED_ADMIN_ROLE", "ADMIN")
    existing = len(Person.list_all_persons()) > 0
    if existing:
        return

    person = Person(
         id=None,
        person_id=PERSON_ID,
        first_name=FIRST_NAME,
        last_name=LAST_NAME,
        email_address=EMAIL,
        address_line_one=None,
        address_line_two=None,
        city=None,
        state_province=None,
        zip_code=None,
        country=None,
        primary_phone=None,
        secondary_phone=None,
        system_role=SYSTEM_ROLE,
        password_hash=None,
        notes="Seeded initial admin account",
        public_notes="",
        locked=False,
        last_edited_by=None,
        last_edited_at=None,
    )

    errors = person.validate()
    if errors:
        print("Validation failed:")
        for e in errors:
            print(f"- {e}")
        sys.exit(1)

    person.set_password(PASSWORD)
    person.save()
    print(f"Created admin account: {PERSON_ID} / {EMAIL}")