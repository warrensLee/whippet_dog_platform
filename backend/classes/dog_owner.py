'''
Docstring for dog owner

TODO:
'''
from werkzeug.security import generate_password_hash, check_password_hash
from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class DogOwner:
    def __init__(self, cwa_id, person_id, last_edited_by=None, last_edited_at=None):
        self.cwa_id = cwa_id
        self.person_id = person_id
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a DogOwner instance from request JSON data."""
        return cls(
            cwa_id=(data.get("cwaId") or "").strip(),
            person_id=(data.get("personId") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a DogOwner instance from a database row."""
        if not row:
            return None
        return cls(
            cwa_id=row.get("CWAID"),
            person_id=row.get("PersonID"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, cwa_id, person_id):
        """Find a dog owner by cwa_id and person_id."""
        row = fetch_one(
            """
            SELECT CWAID, PersonID, LastEditedBy, LastEditedAt
            FROM DogOwner
            WHERE CWAID = %s AND PersonID = %s
            LIMIT 1
            """,
            (cwa_id, person_id,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, cwa_id, person_id):
        """Check if a dog owner with given cwa id and person_id already exists."""
        existing = fetch_one(
            """
            SELECT CWAID, PersonID
            FROM DogOwner
            WHERE CWAID = %s AND PersonID = %s
            LIMIT 1
            """,
            (cwa_id, person_id,),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.cwa_id:
            errors.append("CWA ID is required")
        if not self.person_id:
            errors.append("PersonID is required")
        if len(self.cwa_id) > 10:
            errors.append("CWA ID must be 10 characters or less")
        if len(self.person_id) > 20:
            errors.append("PersonID must be 20 characters or less")
        return errors

    def save(self):
        """Save dog owner to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO DogOwner (
                    CWA_ID, PersonID, LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    self.cwa_id, self.person_id, self.last_edited_by, self.last_edited_at
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update dog owner in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE DogOwner
                SET LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE CWA_ID = %s AND PersonID = %s
                """,
                (
                    self.last_edited_by, self.last_edited_at,
                    self.cwa_id, self.person_id
                ),
            )
            return True
        except Error as e:
            raise e

    def delete(self, cwa_id, person_id):
        """Delete dog owner from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM DogOwner
                WHERE CWA_ID = %s AND PersonID = %s
                """,
                (cwa_id, person_id),
            )
            return True
        except Error as e:
            raise e

    def list_all_dog_owners():
        """Retrieve all dog owners from the database."""
        rows = fetch_all(
            """
            SELECT CWAID, PersonID, LastEditedBy, LastEditedAt
            FROM DogOwner
            """
        )
        return [DogOwner.from_db_row(row) for row in rows]
        
    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "CWAID": self.cwa_id,
            "PersonID": self.person_id
        }

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for JSON responses."""
        data = {
            "cwaId": self.cwa_id,
            "personId": self.person_id,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data
