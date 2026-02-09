'''
Docstring for race_result

TODO:
'''

from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class RaceResult:

    def __init__(self, meet_number, cwa_number, program, race_number, entry_type, box,
                 placement, meet_points, incident, last_edited_by, last_edited_at):
        self.meet_number = meet_number
        self.cwa_number = cwa_number
        self.program = program
        self.race_number = race_number
        self.entry_type = entry_type
        self.box = box
        self.placement = placement
        self.meet_points = meet_points
        self.incident = incident
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a RaceResult instance from request JSON data."""
        return cls(
            meet_number=(data.get("meetNumber") or "").strip(),
            cwa_number=(data.get("cwaNumber") or "").strip(),
            program=(data.get("program") or "").strip(),
            race_number=(data.get("raceNumber") or "").strip(),
            entry_type=(data.get("entryType") or "").strip(),
            box=(data.get("box") or "").strip(),
            placement=(data.get("placement") or "").strip(),
            meet_points=(data.get("meetPoints") or "").strip(),
            incident=(data.get("incident") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a RaceResult instance from a database row."""
        if not row:
            return None
        return cls(
            meet_number=row.get("MeetNumber"),
            cwa_number=row.get("CWANumber"),
            program=row.get("Program"),
            race_number=row.get("RaceNumber"),
            entry_type=row.get("EntryType"),
            box=row.get("Box"),
            placement=row.get("Placement"),
            meet_points=row.get("MeetPoints"),
            incident=row.get("Incident"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, meet_number, cwa_number, program, race_number):
        """Find a race result by meet_number, cwa_number, program, and race number."""
        row = fetch_one(
            """
            SELECT MeetNumber, CWANumber, Program, RaceNumber, EntryType, Box,
                   Placement, MeetPoints, Incident,
                   LastEditedBy, LastEditedAt
            FROM RaceResults
            WHERE MeetNumber = %s AND CWANumber = %s AND Program = %s AND RaceNumber = %s
            LIMIT 1
            """,
            (meet_number, cwa_number, program, race_number),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, meet_number, cwa_number, program, race_number):
        """Check if a race result with given ID already exists."""
        existing = fetch_one(
            """
            SELECT MeetNumber, CWANumber, Program, RaceNumber
            FROM RaceResults
            WHERE MeetNumber = %s AND CWANumber = %s AND Program = %s AND RaceNumber = %s
            LIMIT 1
            """,
            (meet_number, cwa_number, program, race_number),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.meet_number:
            errors.append("Meet number is required")
        if not self.cwa_number:
            errors.append("CWA number is required")
        if not self.program:
            errors.append("Program is required")
        if not self.race_number:
            errors.append("Race number is required")
        if not self.meet_points:
            errors.append("Meet points is required")
        if len(self.meet_number) > 20:
            errors.append("Meet number must be 20 characters or less")
        if len(self.cwa_number) > 10:
            errors.append("CWA number must be 10 characters or less")
        if len(self.program) > 1:
            errors.append("Program must be 1 characters or less")
        if len(self.race_number) > 10:
            errors.append("Race number must be 10 characters or less")
        return errors

    def save(self):
        """Save race result to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO RaceResults (
                    MeetNumber, CWANumber, Program, RaceNumber, EntryType, Box,
                    Placement, MeetPoints, Incident,
                    LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.meet_number,
                    self.cwa_number,
                    self.program,
                    self.race_number,
                    self.entry_type,
                    self.box,
                    self.placement,
                    self.meet_points,
                    self.incident,
                    self.last_edited_by,
                    self.last_edited_at,
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update race result in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE RaceResults
                SET EntryType = %s,
                    Box = %s,
                    Placement = %s,
                    MeetPoints = %s,
                    Incident = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE MeetNumber = %s AND CWANumber = %s AND Program = %s AND RaceNumber = %s
                """,
                (
                    self.entry_type, self.box, self.placement, self.meet_points,
                    self.incident, self.last_edited_by, self.last_edited_at,
                    self.meet_number, self.cwa_number, self.program , self.race_number
                ),      
            )
            return True
        except Error as e:
            raise e
    
    def delete(self, meet_number, cwa_number, program, race_number):
        """Delete race result from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM RaceResults
                WHERE MeetNumber = %s AND CWANumber = %s AND Program = %s AND RaceNumber = %s
                """,
                (meet_number, cwa_number, program, race_number),
            )
            return True
        except Error as e:
            raise e

    def list_all_race_results():
        """Retrieve all race results from the database."""
        rows = fetch_all(
            """
            SELECT MeetNumber, CWANumber, Program, RaceNumber, EntryType, Box,
                   Placement, MeetPoints, Incident,
                   LastEditedBy, LastEditedAt
            FROM RaceResults
            """
        )
        return [RaceResult.from_db_row(row) for row in rows]
            
    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "MeetNumber": self.meet_number,
            "CWA_Number": self.cwa_number,
            "Program": self.program,
            "RaceNumber": self.race_number,
        }

    def to_dict(self):
        """Convert to dictionary for JSON responses."""
        data = {
            "meetNumber": self.meet_number,
            "cwaNumber": self.cwa_number,
            "program": self.program,
            "raceNumber": self.race_number,
            "entryType": self.entry_type,
            "box": self.box,
            "placement": self.placement,
            "meetPoints": self.meet_points,
            "incident": self.incident,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data
