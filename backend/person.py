'''
Docstring for person

TODO:
'''
from werkzeug.security import generate_password_hash, check_password_hash
from database import fetch_one, execute
from mysql.connector import Error

class Person:
    def __init__(self, person_id, first_name, last_name, email_address, address_line_one,
                 address_line_two, city, state_province, zip_code, country,
                 primary_phone, secondary_phone, system_role, password_hash, notes, 
                 last_edited_by=None, last_edited_at=None):
        self.person_id = person_id
        self.first_name = first_name
        self.last_name = last_name
        self.email = email_address
        self.address_line_one = address_line_one
        self.address_line_two = address_line_two
        self.city = city
        self.state_province = state_province
        self.zip_code = zip_code
        self.country = country
        self.primary_phone = primary_phone
        self.secondary_phone = secondary_phone
        self.system_role = system_role
        self.password_hash = password_hash
        self.notes = notes
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a Person instance from request JSON data."""
        return cls(
            person_id=(data.get("personId") or "").strip(),
            first_name=(data.get("firstName") or "").strip(),
            last_name=(data.get("lastName") or "").strip(),
            email_address=(data.get("email") or "").strip(),
            address_line_one=(data.get("addressLineOne") or "").strip() or None,
            address_line_two=(data.get("addressLineTwo") or "").strip() or None,
            city=(data.get("city") or "").strip() or None,
            state_province=(data.get("stateProvince") or "").strip() or None,
            zip_code=(data.get("zipCode") or "").strip() or None,
            country=(data.get("country") or "").strip() or None,
            primary_phone=(data.get("primaryPhone") or "").strip() or None,
            secondary_phone=(data.get("secondaryPhone") or "").strip() or None,
            system_role=data.get("systemRole", "Public"),
            password_hash=None,
            notes=(data.get("notes") or "").strip() or None,
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a Person instance from a database row."""
        if not row:
            return None
        return cls(
            person_id=row.get("PersonID"),
            first_name=row.get("FirstName"),
            last_name=row.get("LastName"),
            email_address=row.get("EmailAddress"),
            address_line_one=row.get("AddressLineOne"),
            address_line_two=row.get("AddressLineTwo"),
            city=row.get("City"),
            state_province=row.get("StateProvince"),
            zip_code=row.get("ZipCode"),
            country=row.get("Country"),
            primary_phone=row.get("PrimaryPhone"),
            secondary_phone=row.get("SecondaryPhone"),
            system_role=row.get("SystemRole"),
            password_hash=row.get("PasswordHash"),
            notes=row.get("Notes"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        """Find a person by email or person_id."""
        row = fetch_one(
            """
            SELECT PersonID, FirstName, LastName, EmailAddress, SystemRole, PasswordHash,
                    AddressLineOne, AddressLineTwo, City, StateProvince, ZipCode, Country,
                   PrimaryPhone, SecondaryPhone, Notes, LastEditedBy, LastEditedAt
            FROM Person
            WHERE PersonID = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, person_id):
        """Check if a person with given ID already exists."""
        existing = fetch_one(
            """
            SELECT PersonID
            FROM Person
            WHERE PersonID = %s
            LIMIT 1
            """,
            (person_id,),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.person_id:
            errors.append("PersonID is required")
        if not self.first_name:
            errors.append("First name is required")
        if not self.last_name:
            errors.append("Last name is required")
        if len(self.person_id) > 20:
            errors.append("PersonID must be 20 characters or less")
        return errors

    def set_password(self, password):
        """Hash and set the password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify password against stored hash."""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def save(self):
        """Save person to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO Person (
                    PersonID, FirstName, LastName, EmailAddress,
                    AddressLineOne, AddressLineTwo, City, StateProvince,
                    ZipCode, Country, PrimaryPhone, SecondaryPhone,
                    SystemRole, PasswordHash, Notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.person_id, self.first_name, self.last_name, self.email,
                    self.address_line_one, self.address_line_two, self.city, self.state_province,
                    self.zip_code, self.country, self.primary_phone, self.secondary_phone,
                    self.system_role, self.password_hash, self.notes
                ),
            )
            return True
        except Error as e:
            raise e

    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "PersonID": self.person_id,
            "FirstName": self.first_name,
            "LastName": self.last_name,
            "EmailAddress": self.email,
            "SystemRole": self.system_role
        }

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for JSON responses."""
        data = {
            "personId": self.person_id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "email": self.email,
            "addressLineOne": self.address_line_one,
            "addressLineTwo": self.address_line_two,
            "city": self.city,
            "stateProvince": self.state_province,
            "zipCode": self.zip_code,
            "country": self.country,
            "primaryPhone": self.primary_phone,
            "secondaryPhone": self.secondary_phone,
            "systemRole": self.system_role,
            "notes": self.notes,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        if include_sensitive:
            data["passwordHash"] = self.password_hash
        return data