'''
Docstring for user_role

TODO:
'''

from werkzeug.security import generate_password_hash, check_password_hash
from database import fetch_one, execute
from mysql.connector import Error

class UserRole:

    #VALID_SYSTEM_ROLES = {"Admin", "Editor", "Viewer"}
    VALID_USER_ROLES = {"Admin, Public"}


    def __init__(self, role_id, title, last_edited_by=None, last_edited_at=None):
        self.role_id = role_id
        self.title = title
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a UserRole instance from request JSON data."""
        return cls(
            role_id=(data.get("roleId") or "").strip(),
            title=(data.get("title") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )   
    
    @classmethod
    def from_db_row(cls, row):
        """Create a UserRole instance from a database row."""
        if not row:
            return None
        return cls(
            role_id=row.get("RoleID"),
            title=row.get("Title"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        """Find a user role by role_id."""
        row = fetch_one(
            """
            SELECT RoleID, Title, LastEditedBy, LastEditedAt
            FROM UserRole
            WHERE RoleID = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, role_id):
        """Check if a user role with given ID already exists."""
        existing = fetch_one(
            """
            SELECT RoleID
            FROM UserRole
            WHERE RoleID = %s
            LIMIT 1
            """,
            (role_id,),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.role_id:
            errors.append("RoleID is required")
        if not self.title:
            errors.append("Title is required")
        if len(self.title) > 10:
            errors.append("Title must be 10 characters or less")
        return errors

    def save(self):
        """Save user role to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO UserRole (
                    RoleID, Title, LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    self.role_id, self.title, self.last_edited_by, self.last_edited_at
                ),
            )
            return True
        except Error as e:
            raise e

    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "Role": self.role_id,
            "Title": self.title
        }

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for JSON responses."""
        data = {
            "role": self.role_id,
            "title": self.title,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data
