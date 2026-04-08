import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from classes.person import Person

PERSON_ID = os.getenv("SEED_ADMIN_ID", "admin")
FIRST_NAME = os.getenv("SEED_ADMIN_FIRST_NAME", "Site")
LAST_NAME = os.getenv("SEED_ADMIN_LAST_NAME", "Admin")
EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@example.com")
PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "ChangeMe123!")
SYSTEM_ROLE = os.getenv("SEED_ADMIN_ROLE", "ADMIN")

def seed_user():
    existing = Person.find_by_identifier(PERSON_ID) or Person.find_by_email(EMAIL)
    if existing:
        print(f"Admin already exists: {existing.person_id} ({existing.email})")
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


if __name__ == "__main__":
    main()