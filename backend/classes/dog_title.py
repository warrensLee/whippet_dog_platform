'''
Docstring for dog title

TODO:
'''
from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class DogTitle:
    def __init__(self, cwa_number, title, title_number, title_date, name_prefix, name_suffix,
                 last_edited_by=None, last_edited_at=None):
        self.cwa_number = cwa_number
        self.title = title
        self.title_number = title_number
        self.title_date = title_date
        self.name_prefix = name_prefix
        self.name_suffix = name_suffix
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a DogTitle instance from request JSON data."""
        return cls(
            cwa_number=(data.get("cwaNumber") or "").strip(),
            title=(data.get("title") or "").strip(),
            title_number=(data.get("titleNumber") or "").strip(),
            title_date=data.get("titleDate"),
            name_prefix=(data.get("namePrefix") or "").strip(),
            name_suffix=(data.get("nameSuffix") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a DogTitle instance from a database row."""
        if not row:
            return None
        return cls(
            cwa_number=row.get("CwaNumber"),
            title=row.get("Title"),
            title_number=row.get("TitleNumber"),
            title_date=row.get("TitleDate"),
            name_prefix=row.get("NamePrefix"),
            name_suffix=row.get("NameSuffix"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, cwa_number, title):
        """Find a person by cwa_number and title."""
        row = fetch_one(
            """
            SELECT CWANumber, Title, TitleNumber, TitleDate, NamePrefix, NameSuffix, LastEditedBy, LastEditedAt
            FROM DogTitles
            WHERE CWANumber = %s AND Title = %s
            LIMIT 1
            """,
            (cwa_number, title,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, cwa_number, title):
        """Check if a dog title with given cwa number and title already exists."""
        existing = fetch_one(
            """
            SELECT CWANumber, Title
            FROM DogTitles
            WHERE CWANumber = %s AND Title = %s
            LIMIT 1
            """,
            (cwa_number, title,),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.cwa_number:
            errors.append("CWA number is required")
        if not self.title:
            errors.append("Title is required")
        if not self.title_number:
            errors.append("Title number is required")
        if not self.name_prefix:
            errors.append("Name prefix is required")
        if not self.name_suffix:
            errors.append("Name suffix is required")
        if len(self.cwa_number) > 10:
            errors.append("CWA number must be 10 characters or less")
        if len(self.title) > 10:
            errors.append("Title must be 10 characters or less")
        if len(self.title_number) > 10:
            errors.append("Title number must be 10 characters or less")
        return errors

    def save(self):
        """Save dog title to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO DogTitles (
                    CWANumber, Title, TitleNumber, TitleDate, NamePrefix, NameSuffix,
                    LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.cwa_number,
                    self.title,
                    self.title_number,
                    self.title_date,
                    self.name_prefix,
                    self.name_suffix,
                    self.last_edited_by,
                    self.last_edited_at
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update dog title in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE DogTitles
                SET TitleNumber = %s,
                    TitleDate = %s,
                    NamePrefix = %s,
                    NameSuffix = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE CWANumber = %s AND Title = %s
                """,
                (
                    self.title_number,
                    self.title_date,
                    self.name_prefix,
                    self.name_suffix,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.cwa_number,
                    self.title
                ),
            )
            return True
        except Error as e:
            raise e

    def delete(self, cwa_number, title):
        """Delete dog title from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM DogTitles
                WHERE CWANumber = %s AND Title = %s
                """,
                (cwa_number, title),
            )
            return True
        except Error as e:
            raise e

    def list_all_dog_titles():
        """Retrieve all dog titles from the database."""
        rows = fetch_all(
            """
            SELECT CWANumber, Title, TitleNumber, TitleDate, NamePrefix, NameSuffix, LastEditedBy, LastEditedAt
            FROM DogTitles
            """
        )
        return [DogTitle.from_db_row(row) for row in rows]
    
    @classmethod
    def list_titles_for_owner(cls, person_id):
        """Get all titles for dogs owned by a specific person."""
        query = """
            SELECT dt.*
            FROM DogTitles dt
            JOIN DogOwner do ON do.CWAID = dt.CWANumber
            WHERE do.PersonID = %s
            """
        rows = fetch_all(query, (person_id,))
        return [cls.from_db_row(row) for row in rows]
    
    @classmethod
    def delete_all_for_title(cls, title: str):
        title = (title or "").strip()
        execute("DELETE FROM DogTitles WHERE Title = %s", (title,))


    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "CWANumber": self.cwa_number,
            "Title": self.title,
            "TitleNumber": self.title_number,
        }

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for JSON responses."""
        data = {
            "cwaNumber": self.cwa_number,
            "title": self.title,
            "titleNumber": self.title_number,
            "titleDate": self.title_date,
            "namePrefix": self.name_prefix,
            "nameSuffix": self.name_suffix,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data
