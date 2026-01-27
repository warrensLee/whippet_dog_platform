'''
Docstring for title

TODO:
Finish check_eligibility method
Finish award_title method
'''

from werkzeug.security import generate_password_hash, check_password_hash
from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class TitleType:

    def __init__(self, title, title_description, last_edited_by=None, last_edited_at=None):
        self.title = title
        self.title_description = title_description
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def check_eligibility():
        pass

    @classmethod
    def award_title():
        pass

    @classmethod
    def from_request_data(cls, data):
        """Create a TitleType instance from request JSON data."""
        return cls(
            title=(data.get("title") or "").strip(),
            title_description=(data.get("titleDescription") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )

    @classmethod
    def from_db_row(cls, row):
        """Create a TitleType instance from a database row."""
        if not row:
            return None
        return cls(
            title=row.get("Title"),
            title_description=row.get("TitleDescription"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        """Find a title type by title."""
        row = fetch_one(
            """
            SELECT Title, TitleDescription, LastEditedBy, LastEditedAt
            FROM TitleType
            WHERE Title = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, title):
        """Check if a title type with given title already exists."""
        existing = fetch_one(
            """
            SELECT Title
            FROM TitleType
            WHERE Title = %s
            LIMIT 1
            """,
            (title,),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.title:
            errors.append("Title is required")
        if not self.title_description:
            errors.append("Title description is required")
        if len(self.title) > 10:
            errors.append("Title must be 10 characters or less")
        if len(self.title_description) > 200:
            errors.append("Title description must be 200 characters or less")
        return errors

    def save(self):
        """Save title type to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO TitleType (
                    Title, TitleDescription, LastEditedBy, LastEditedAt
                ) VALUES (%s, %s, %s, %s)
                """,
                (
                    self.title, self.title_description, self.last_edited_by, self.last_edited_at
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update title type in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE TitleType
                SET TitleDescription = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE Title = %s
                """,
                (
                    self.title_description,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.title
                ),
            )
            return True
        except Error as e:
            raise e
        
    def delete(self, title):
        """Delete title type from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM TitleType
                WHERE Title = %s
                """,
                (title,),
            )
            return True
        except Error as e:
            raise e

    def show_all_title_types():
        """Retrieve all title types from the database."""
        rows = fetch_all(
            """
            SELECT Title, TitleDescription, LastEditedBy, LastEditedAt
            FROM TitleType
            """
        )
        return [TitleType.from_db_row(row) for row in rows]
        
    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "Title": self.title,
            "TitleDescription": self.title_description,
        }

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for JSON responses."""
        data = {
            "title": self.title,
            "titleDescription": self.title_description,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data
