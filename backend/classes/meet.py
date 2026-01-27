'''
Docstring for meet

TODO:
'''

from werkzeug.security import generate_password_hash, check_password_hash
from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class Meet:

    def __init__(self, meet_number, club_abbreviation, meet_date, race_secretary, judge,
                 location, yards, last_edited_by, last_edited_at):
        self.meet_number = meet_number
        self.club_abbreviation = club_abbreviation
        self.meet_date = meet_date
        self.race_secretary = race_secretary
        self.judge = judge
        self.location = location
        self.yards = yards
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a Meet instance from request JSON data."""
        return cls(
            meet_number=(data.get("meetNumber") or "").strip(),
            club_abbreviation=(data.get("clubAbbreviation") or "").strip(),
            meet_date=data.get("meetDate"),
            race_secretary=(data.get("raceSecretary") or "").strip(),
            judge=(data.get("judge") or "").strip(),
            location=(data.get("location") or "").strip(),
            yards=(data.get("yards") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a Meet instance from a database row."""
        if not row:
            return None
        return cls(
            meet_number=row.get("MeetNumber"),
            club_abbreviation=row.get("ClubAbbreviation"),
            meet_date=row.get("MeetDate"),
            race_secretary=row.get("RaceSecretary"),
            judge=row.get("Judge"),
            location=row.get("Location"),
            yards=row.get("Yards"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        """Find a meet by meet_number."""
        row = fetch_one(
            """
            SELECT MeetNumber, ClubAbbreviation, MeetDate, RaceSecretary, Judge,
                   Location, Yards, LastEditedBy, LastEditedAt
            FROM Meet
            WHERE MeetNumber = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, meet_number):
        """Check if a meet with given meet number already exists."""
        existing = fetch_one(
            """
            SELECT MeetNumber
            FROM Meet
            WHERE MeetNumber = %s
            LIMIT 1
            """,
            (meet_number,),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.meet_number:
            errors.append("Meet number is required")
        if not self.club_abbreviation:
            errors.append("Club abbreviation is required")
        if not self.meet_date:
            errors.append("Meet date is required")
        if not self.location:
            errors.append("Location is required")
        if not self.yards:
            errors.append("Yards are required")
        if len(self.meet_number) > 20:
            errors.append("Meet number must be 20 characters or less")
        if len(self.club_abbreviation) > 10:
            errors.append("Club abbreviation must be 10 characters or less")
        if len(self.location) > 20:
            errors.append("Location must be 20 characters or less")
        return errors

    def save(self):
        """Save meet to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO Meet (
                    MeetNumber, ClubAbbreviation, MeetDate, RaceSecretary, Judge,
                    Location, Yards, LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.meet_number,
                    self.club_abbreviation,
                    self.meet_date,
                    self.race_secretary,
                    self.judge,
                    self.location,
                    self.yards,
                    self.last_edited_by,
                    self.last_edited_at
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update meet in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE Meet
                SET ClubAbbreviation = %s,
                    MeetDate = %s,
                    RaceSecretary = %s,
                    Judge = %s,
                    Location = %s,
                    Yards = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE MeetNumber = %s
                """,
                (
                    self.club_abbreviation,
                    self.meet_date,
                    self.race_secretary,
                    self.judge,
                    self.location,
                    self.yards,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.meet_number
                ),
            )
            return True
        except Error as e:
            raise e
    
    def delete(self, meet_number):
        """Delete meet from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM Meet
                WHERE MeetNumber = %s
                """,
                (meet_number,),
            )
            return True
        except Error as e:
            raise e

    def show_all_meets():
        """Retrieve all meets from the database."""
        rows = fetch_all(
            """
            SELECT MeetNumber, ClubAbbreviation, MeetDate, RaceSecretary, Judge,
                   Location, Yards, LastEditedBy, LastEditedAt
            FROM Meet
            """
        )
        return [Meet.from_db_row(row) for row in rows]
        
    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "meetNumber": self.meet_number,
            "clubAbbreviation": self.club_abbreviation,
            "meetDate": self.meet_date,
            "location": self.location,
        }

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for JSON responses."""
        data = {
            "meetNumber": self.meet_number,
            "clubAbbreviation": self.club_abbreviation,
            "meetDate": self.meet_date,
            "raceSecretary": self.race_secretary,
            "judge": self.judge,
            "location": self.location,
            "yards": self.yards,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data

    
